from fastapi import APIRouter, Query, HTTPException
from fastapi.responses import Response
from pydantic import BaseModel
from typing import Optional
from services.tts_service import tts_service, precache_common_phrases

router = APIRouter(prefix="/api/voice", tags=["voice"])

class SynthesizeRequest(BaseModel):
    text: str
    rate: Optional[float] = 1.0

class BatchSynthesizeRequest(BaseModel):
    texts: list[str]
    rate: Optional[float] = 1.0

@router.post("/synthesize")
async def synthesize_speech(request: SynthesizeRequest):
    if not request.text or not request.text.strip():
        raise HTTPException(status_code=400, detail="Text is required")
    
    if len(request.text) > 5000:
        raise HTTPException(status_code=400, detail="Text too long (max 5000 characters)")
    
    audio_data = await tts_service.synthesize(request.text, request.rate or 1.0)
    
    if not audio_data:
        raise HTTPException(status_code=500, detail="Failed to synthesize speech")
    
    return Response(
        content=audio_data,
        media_type="audio/wav",
        headers={
            "Content-Disposition": 'inline; filename="speech.wav"',
            "Cache-Control": "public, max-age=86400"
        }
    )

@router.get("/synthesize")
async def synthesize_speech_get(
    text: str = Query(..., description="Text to synthesize"),
    rate: float = Query(1.0, description="Speech rate (0.5-2.0)")
):
    if not text or not text.strip():
        raise HTTPException(status_code=400, detail="Text is required")
    
    if len(text) > 5000:
        raise HTTPException(status_code=400, detail="Text too long (max 5000 characters)")
    
    rate = max(0.5, min(2.0, rate))
    
    audio_data = await tts_service.synthesize(text, rate)
    
    if not audio_data:
        raise HTTPException(status_code=500, detail="Failed to synthesize speech")
    
    return Response(
        content=audio_data,
        media_type="audio/wav",
        headers={
            "Content-Disposition": 'inline; filename="speech.wav"',
            "Cache-Control": "public, max-age=86400"
        }
    )

@router.post("/batch")
async def batch_synthesize(request: BatchSynthesizeRequest):
    if not request.texts:
        raise HTTPException(status_code=400, detail="Texts array is required")
    
    if len(request.texts) > 20:
        raise HTTPException(status_code=400, detail="Maximum 20 texts per batch")
    
    audio_results = await tts_service.synthesize_batch(request.texts, request.rate or 1.0)
    
    import base64
    encoded_results = []
    for audio in audio_results:
        if audio:
            encoded_results.append(base64.b64encode(audio).decode("utf-8"))
        else:
            encoded_results.append(None)
    
    return {"audio": encoded_results}

@router.post("/precache")
async def precache_phrases():
    await precache_common_phrases()
    return {"status": "ok", "message": "Common phrases precached"}

@router.get("/cache/stats")
async def get_cache_stats():
    file_count, total_size = tts_service.get_cache_size()
    return {
        "cached_files": file_count,
        "total_size_bytes": total_size,
        "total_size_mb": round(total_size / (1024 * 1024), 2)
    }

@router.delete("/cache")
async def clear_cache():
    count = tts_service.clear_cache()
    return {"status": "ok", "cleared_files": count}
