import os
import json
import time
from typing import List

from fastapi import UploadFile, HTTPException

from unstructured_client import UnstructuredClient
from unstructured_client.models.operations import (
    CreateJobRequest,
    DownloadJobOutputRequest
)
from unstructured_client.models.shared import (
    BodyCreateJob,
    InputFiles,
    JobInformation
)

UNSTRUCTURED_API_KEY = os.getenv("UNSTRUCTURED_API_KEY")
if not UNSTRUCTURED_API_KEY:
    raise RuntimeError("UNSTRUCTURED_API_KEY is not set")

SUPPORTED_TYPES = {
    "application/pdf",
    "text/plain",
    "text/markdown",
    "text/html",
    "application/rtf",
    "application/epub+zip",
    "application/xml",
    "application/vnd.oasis.opendocument.text",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "image/jpeg",
    "image/png",
    "image/tiff",
    "image/bmp",
    "image/heic",
}


def run_on_demand_job(
    client: UnstructuredClient,
    uploaded_files: List[UploadFile],
    job_nodes: list[dict],
) -> tuple[str, list[str]]:

    input_files: list[InputFiles] = []

    for file in uploaded_files:
        if file.content_type not in SUPPORTED_TYPES:
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported file type: {file.content_type}"
            )

        file.file.seek(0)
        file_bytes = file.file.read()

        if not file_bytes:
            raise HTTPException(
                status_code=400,
                detail=f"{file.filename} is empty"
            )

        input_files.append(
            InputFiles(
                content=file_bytes,
                file_name=file.filename,
                content_type=file.content_type,
            )
        )

    response = client.jobs.create_job(
        request=CreateJobRequest(
            body_create_job=BodyCreateJob(
                request_data=json.dumps({"job_nodes": job_nodes}),
                input_files=input_files,
            )
        )
    )

    return (
        response.job_information.id,
        response.job_information.input_file_ids,
    )


def poll_for_job_status(
    client: UnstructuredClient,
    job_id: str,
) -> JobInformation:

    while True:
        job = client.jobs.get_job(
            request={"job_id": job_id}
        ).job_information

        if job.status in ("SCHEDULED", "IN_PROGRESS"):
            time.sleep(2.5)
        else:
            return job


def download_job_output(
    client: UnstructuredClient,
    job_id: str,
    input_file_ids: list[str],
) -> dict[str, dict]:

    outputs = {}

    for file_id in input_file_ids:
        response = client.jobs.download_job_output(
            request=DownloadJobOutputRequest(
                job_id=job_id,
                file_id=file_id,
            )
        )
        outputs[file_id] = response.any

    return outputs


async def parse_files(files: List[UploadFile]) -> dict:
    with UnstructuredClient(api_key_auth=UNSTRUCTURED_API_KEY) as client:
        vlm_partitioner_node = {
            "name": "Partitioner",
            "subtype": "unstructured_api",
            "type": "partition",
            "settings": {
                "strategy": "hi_res",
                "pdf_infer_table_structure": False,
                "extract_image_block_types": [],
                "coordinates": False,
                "exclude_elements": ["Image"],
                "include_page_breaks": False,

            }
        }

        job_id, input_file_ids = run_on_demand_job(
            client=client,
            uploaded_files=files,
            job_nodes=[vlm_partitioner_node],
        )

        job = poll_for_job_status(client, job_id)

        if job.status != "COMPLETED":
            raise RuntimeError(f"Job failed with status {job.status}")

        outputs = download_job_output(
            client=client,
            job_id=job_id,
            input_file_ids=input_file_ids,
        )

        return {
            "job_id": job_id,
            "outputs": outputs,
        }
