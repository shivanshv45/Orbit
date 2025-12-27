from fastapi import FastAPI, UploadFile, File, HTTPException
from typing import List, Optional
import os
import json
import time
import traceback

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

# --------------------------------------------------
# CONFIG
# --------------------------------------------------

UNSTRUCTURED_API_KEY = os.getenv("UNSTRUCTURED_API_KEY")
if not UNSTRUCTURED_API_KEY:
    raise RuntimeError("UNSTRUCTURED_API_KEY is not set")

app = FastAPI(title="Orbit")

# --------------------------------------------------
# CORE UNSTRUCTURED LOGIC
# --------------------------------------------------

def run_on_demand_job(
        client: UnstructuredClient,
        uploaded_files: List[UploadFile],
        job_template_id: Optional[str] = None,
        job_nodes: Optional[list[dict[str, object]]] = None,
) -> tuple[str, list[str]]:
    """
    Create and start an Unstructured on-demand job using uploaded PDFs.
    """

    input_files: list[InputFiles] = []
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

    if job_template_id and job_nodes:
        raise ValueError("Specify either job_template_id or job_nodes, not both")

    if job_template_id:
        request_data = json.dumps({"template_id": job_template_id})
    elif job_nodes:
        request_data = json.dumps({"job_nodes": job_nodes})
    else:
        raise ValueError("Must specify job_template_id or job_nodes")

    response = client.jobs.create_job(
        request=CreateJobRequest(
            body_create_job=BodyCreateJob(
                request_data=request_data,
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
    """
    Poll job status until completion.
    """
    while True:
        job = client.jobs.get_job(
            request={"job_id": job_id}
        ).job_information

        if job.status in ("SCHEDULED", "IN_PROGRESS"):
            time.sleep(5)
        else:
            return job


def download_job_output(
        client: UnstructuredClient,
        job_id: str,
        input_file_ids: list[str],
) -> dict[str, dict]:
    """
    Download parsed JSON outputs into output/ directory.
    """

    outputs: dict[str, dict] = {}

    for file_id in input_file_ids:

        response = client.jobs.download_job_output(
            request=DownloadJobOutputRequest(
                job_id=job_id,
                file_id=file_id,
            )
        )
        outputs[file_id] = response.any

    return outputs

# --------------------------------------------------
# API ENDPOINT
# --------------------------------------------------


@app.get("/")
def check():
    return {"content":"hello_world"}

@app.post("/parse")
async def parse_pdfs(files: List[UploadFile] = File(...)):
    """
    Upload PDF(s) → Parse with Unstructured → Save JSON to output/
    """
    try:
        with UnstructuredClient(api_key_auth=UNSTRUCTURED_API_KEY) as client:
            job_id, input_file_ids = run_on_demand_job(
                client=client,
                uploaded_files=files,
                job_template_id="hi_res_and_enrichment",
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
            "message": "Parsing completed successfully",
            "job_id": job_id,
            "outputs": outputs,
        }

    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


