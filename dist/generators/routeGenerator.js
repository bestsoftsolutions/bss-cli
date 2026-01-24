import {toClassName,mapPydanticType}from'../typeMapping.js';function m(s,i,d,o){const r=toClassName(i),e=i.toLowerCase(),t=o.length>0?o[0].toLowerCase():"id",n=o.length>0?d.find(_=>_.name===o[0]):null,a=n&&mapPydanticType(n)==="int"?"int":"str";return `from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from typing import List, Optional
from app.db.session import get_db
from .schema import ${r}, ${r}Create, ${r}Update
from .service import ${r}Service

router = APIRouter(
    tags=["${s}"]
)

service = ${r}Service()


@router.get("/", response_model=List[${r}])
def get_${e}_list(
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(100, ge=1, le=1000, description="Maximum number of records to return"),
    db: Session = Depends(get_db)
):
    """
    Retrieve a list of ${e} records with pagination.
    """
    items = service.get_all(db, skip=skip, limit=limit)
    return items


@router.get("/count", response_model=dict)
def get_${e}_count(db: Session = Depends(get_db)):
    """
    Get the total count of ${e} records.
    """
    count = service.count(db)
    return {"count": count}


@router.get("/{${t}}", response_model=${r})
def get_${e}(${t}: ${a}, db: Session = Depends(get_db)):
    """
    Retrieve a single ${e} record by ID.
    """
    item = service.get_by_id(db, ${t})
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"${r} with ${t} {${t}} not found"
        )
    return item


@router.post("/", response_model=${r}, status_code=status.HTTP_201_CREATED)
def create_${e}(${e}_data: ${r}Create, db: Session = Depends(get_db)):
    """
    Create a new ${e} record.
    """
    try:
        new_item = service.create(db, ${e}_data)
        return new_item
    except IntegrityError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Integrity constraint violation: {str(e.orig)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creating ${e}: {str(e)}"
        )


@router.put("/{${t}}", response_model=${r})
def update_${e}(
    ${t}: ${a},
    ${e}_data: ${r}Update,
    db: Session = Depends(get_db)
):
    """
    Update an existing ${e} record (full update).
    """
    try:
        item = service.update(db, ${t}, ${e}_data)
        if not item:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"${r} with ${t} {${t}} not found"
            )
        return item
    except IntegrityError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Integrity constraint violation: {str(e.orig)}"
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error updating ${e}: {str(e)}"
        )


@router.patch("/{${t}}", response_model=${r})
def partial_update_${e}(
    ${t}: ${a},
    ${e}_data: ${r}Update,
    db: Session = Depends(get_db)
):
    """
    Partially update an existing ${e} record.
    """
    try:
        item = service.update(db, ${t}, ${e}_data)
        if not item:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"${r} with ${t} {${t}} not found"
            )
        return item
    except IntegrityError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Integrity constraint violation: {str(e.orig)}"
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error updating ${e}: {str(e)}"
        )


@router.delete("/{${t}}", status_code=status.HTTP_204_NO_CONTENT)
def delete_${e}(${t}: ${a}, db: Session = Depends(get_db)):
    """
    Delete a ${e} record.
    """
    deleted = service.delete(db, ${t})
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"${r} with ${t} {${t}} not found"
        )
    return None
`}function l(s,i,d,o,r){const e=toClassName(i),t=i.toLowerCase();return `from fastapi import APIRouter, Depends, HTTPException, status, Query, Path
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from typing import List, Optional, Any
from database import get_db
from .schema import ${e}
from .service import ${e}Service

# Import Parameter schema and data service
try:
    from .schema import ${e}Parameter
except ImportError:
    ${e}Parameter = None

try:
    from .data_service import ${e}DataService
    data_service = ${e}DataService()
except ImportError:
    data_service = None

router = APIRouter(
    prefix="/${s}",
    tags=["${s}"]
)

service = ${e}Service()


# ============= MASTER TABLE ENDPOINTS (${i}) =============

@router.get("/", response_model=List[${e}])
def get_${t}_list(
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(100, ge=1, le=1000, description="Maximum number of records to return"),
    db: Session = Depends(get_db)
):
    """Get list of ${t} records"""
    items = service.get_all(db, skip=skip, limit=limit)
    return items


@router.get("/count", response_model=dict)
def get_${t}_count(db: Session = Depends(get_db)):
    """Get total count of ${t} records"""
    count = service.count(db)
    return {"count": count}


@router.get("/{id}", response_model=${e})
def get_${t}(id: int, db: Session = Depends(get_db)):
    """Get a single ${t} record with all details"""
    item = service.get_by_id(db, id)
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"${e} with id {id} not found"
        )
    return item


@router.post("/", response_model=${e}, status_code=status.HTTP_201_CREATED)
def create_${t}(data: dict, db: Session = Depends(get_db)):
    """Create a new ${t} record"""
    try:
        new_item = service.create(db, data)
        return new_item
    except IntegrityError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Integrity constraint violation: {str(e.orig)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creating ${t}: {str(e)}"
        )


@router.put("/{id}", response_model=${e})
def update_${t}(id: int, data: dict, db: Session = Depends(get_db)):
    """Update a ${t} record"""
    try:
        item = service.update(db, id, data)
        if not item:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"${e} with id {id} not found"
            )
        return item
    except IntegrityError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Integrity constraint violation: {str(e.orig)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error updating ${t}: {str(e)}"
        )


@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_${t}(id: int, db: Session = Depends(get_db)):
    """Delete a ${t} record"""
    try:
        success = service.delete(db, id)
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"${e} with id {id} not found"
            )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error deleting ${t}: {str(e)}"
        )


# ============= DATA ROUTES (Dynamic SQL Query Endpoints) =============

@router.post("/data/{field_name}", tags=["data"])
def get_field_data(
    field_name: str = Path(..., description="Name of the field to fetch data for"),
    params: Optional[Any] = None,
    db: Session = Depends(get_db)
):
    '''
    Factory endpoint to get data for any field with fldsql defined.
    
    Args:
        field_name: Name of the field (from axflds.fname)
        params: Filter parameters to bind to the SQL query
        
    Returns:
        {
            "success": true,
            "data": [...],  // List if field is select mode, scalar otherwise
            "field": "field_name"
        }
        
    Raises:
        404: If field_name is not found
        500: If query execution fails
    '''
    if data_service is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Data service not available"
        )
    
    try:
        # Prepare parameters
        params_dict = None
        if params:
            if hasattr(params, 'model_dump'):
                params_dict = params.model_dump(exclude_none=True)
            elif isinstance(params, dict):
                params_dict = params
        
        # Call factory function
        result = data_service.get_field_data(db, field_name, params_dict)
        
        return {
            "success": True,
            "field": field_name,
            "data": result
        }
    
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching data for field '{field_name}': {str(e)}"
        )
`}function T(s){return `"""
${s.charAt(0).toUpperCase()+s.slice(1)} Module
Auto-generated module for ${s} API endpoints
"""

from .model import *
from .schema import *
from .service import *
from .routes import router

__all__ = ['router']
`}export{m as generateFastApiRoutes,T as generateInitFile,l as generateUnifiedRoutes};