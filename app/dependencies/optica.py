from fastapi import Header, HTTPException

def get_optica_id(x_optica_id: str | None = Header(default=None, alias="X-Optica-Id")) -> str:
    if not x_optica_id:
        raise HTTPException(status_code=400, detail="Falta el header X-Optica-Id")
    return x_optica_id
