import {toClassName}from'../typeMapping.js';function f(n,o,c){const t=toClassName(n),i=n.toLowerCase(),r=c.length>0?c[0].toLowerCase():"id";return `from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from typing import List, Optional
from .model import ${t}
from .schema import ${t}Create, ${t}Update


class ${t}Service:
    """
    Service layer for ${t} business logic.
    Handles database operations and business rules.
    """
    
    @staticmethod
    def get_all(
        db: Session,
        skip: int = 0,
        limit: int = 100,
        filters: Optional[dict] = None
    ) -> List[${t}]:
        """
        Retrieve all ${i} records with optional filtering and pagination.
        
        Args:
            db: Database session
            skip: Number of records to skip
            limit: Maximum number of records to return
            filters: Optional dictionary of filters to apply
            
        Returns:
            List of ${t} objects
        """
        query = db.query(${t})
        
        # Apply filters if provided
        if filters:
            for key, value in filters.items():
                if hasattr(${t}, key) and value is not None:
                    query = query.filter(getattr(${t}, key) == value)
        
        return query.offset(skip).limit(limit).all()
    
    @staticmethod
    def get_by_id(db: Session, ${r}: any) -> Optional[${t}]:
        """
        Retrieve a single ${i} record by ID.
        
        Args:
            db: Database session
            ${r}: Primary key value
            
        Returns:
            ${t} object if found, None otherwise
        """
        return db.query(${t}).filter(
            ${t}.${r} == ${r}
        ).first()
    
    @staticmethod
    def create(db: Session, ${i}_data: ${t}Create) -> ${t}:
        """
        Create a new ${i} record.
        
        Args:
            db: Database session
            ${i}_data: Data for creating the record
            
        Returns:
            Created ${t} object
            
        Raises:
            IntegrityError: If constraint violation occurs
        """
        try:
            new_item = ${t}(**${i}_data.model_dump(exclude_unset=True))
            db.add(new_item)
            db.commit()
            db.refresh(new_item)
            return new_item
        except IntegrityError as e:
            db.rollback()
            raise e
    
    @staticmethod
    def update(
        db: Session,
        ${r}: any,
        ${i}_data: ${t}Update
    ) -> Optional[${t}]:
        """
        Update an existing ${i} record.
        
        Args:
            db: Database session
            ${r}: Primary key value
            ${i}_data: Data for updating the record
            
        Returns:
            Updated ${t} object if found, None otherwise
            
        Raises:
            IntegrityError: If constraint violation occurs
        """
        item = ${t}Service.get_by_id(db, ${r})
        if not item:
            return None
        
        try:
            # Update only provided fields
            update_data = ${i}_data.model_dump(exclude_unset=True)
            for field, value in update_data.items():
                setattr(item, field, value)
            
            db.commit()
            db.refresh(item)
            return item
        except IntegrityError as e:
            db.rollback()
            raise e
    
    @staticmethod
    def delete(db: Session, ${r}: any) -> bool:
        """
        Delete a ${i} record.
        
        Args:
            db: Database session
            ${r}: Primary key value
            
        Returns:
            True if deleted, False if not found
        """
        item = ${t}Service.get_by_id(db, ${r})
        if not item:
            return False
        
        db.delete(item)
        db.commit()
        return True
    
    @staticmethod
    def count(db: Session, filters: Optional[dict] = None) -> int:
        """
        Count ${i} records with optional filtering.
        
        Args:
            db: Database session
            filters: Optional dictionary of filters to apply
            
        Returns:
            Count of matching records
        """
        query = db.query(${t})
        
        if filters:
            for key, value in filters.items():
                if hasattr(${t}, key) and value is not None:
                    query = query.filter(getattr(${t}, key) == value)
        
        return query.count()
    
    @staticmethod
    def exists(db: Session, ${r}: any) -> bool:
        """
        Check if a ${i} record exists.
        
        Args:
            db: Database session
            ${r}: Primary key value
            
        Returns:
            True if exists, False otherwise
        """
        return db.query(${t}).filter(
            ${t}.${r} == ${r}
        ).first() is not None


# Convenience instance for easier imports
${i}_service = ${t}Service()
`}function _(n,o,c,t){const i=toClassName(n),r=n.toLowerCase();let s=`from sqlalchemy.orm import Session
from .model import ${i}`;for(const d of o){const e=toClassName(d);s+=`, ${e}`;}s+=`
from typing import List, Optional


class ${i}Service:
    """Unified service for ${n} and related detail tables"""
    
    # ============= MASTER TABLE OPERATIONS =============
    
    def get_all(self, db: Session, skip: int = 0, limit: int = 100) -> List[${i}]:
        """Get all ${r} records"""
        return db.query(${i}).offset(skip).limit(limit).all()
    
    def get_by_id(self, db: Session, id: int) -> Optional[${i}]:
        """Get a single ${r} record by ID"""
        return db.query(${i}).filter(${i}.id == id).first()
    
    def create(self, db: Session, data: dict) -> ${i}:
        """
        Create a new ${r} record with optional nested detail records.
        
        Args:
            data: dict with structure:
            {
                'master_field1': value1,
                'master_field2': value2,
                ...
                'detail_table_1': [
                    {'detail_field1': value1, ...},
                    {'detail_field1': value2, ...}
                ],
                'detail_table_2': [
                    {'detail_field1': value1, ...}
                ],
                ...
            }
        
        Returns:
            Master record with all created details (single transaction)
        """
        # Extract detail records from data
        detail_records = {}
        detail_tables_names = ${JSON.stringify(o.map(d=>d.toLowerCase()))}
        
        for detail_name in detail_tables_names:
            detail_records[detail_name] = data.pop(detail_name, [])
        
        try:
            # Create master record
            db_item = ${i}(**data)
            db.add(db_item)
            db.flush()  # Flush to get the ID without committing
            `;for(const d of o){const e=toClassName(d),a=d.toLowerCase();s+=`
            # Create ${e} detail records directly
            for detail_data in detail_records.get('${a}', []):
                detail_data['master_id'] = db_item.id
                detail_item = ${e}(**detail_data)
                db.add(detail_item)
            `;}s+=`
            # Commit all changes in one transaction
            db.commit()
            db.refresh(db_item)
            
            return db_item
        
        except Exception as e:
            db.rollback()
            raise Exception(f"Error creating master with details: {str(e)}")
    
    def update(self, db: Session, id: int, data: dict) -> Optional[${i}]:
        """
        Update a ${r} record with optional nested detail records.
        
        Smart update logic:
        - Insert new detail records (those without 'id')
        - Update existing detail records (those with 'id')
        - Delete detail records not in the new list
        
        Args:
            data: dict with structure:
            {
                'master_field1': value1,
                ...
                'detail_table_1': [
                    {'id': 1, 'detail_field1': value1, ...},  # UPDATE
                    {'detail_field1': value2, ...},            # INSERT
                    ...
                ],
                ...
            }
        
        Returns:
            Updated master record with all updated details (single transaction)
        """
        # Extract detail records from data
        detail_records = {}
        detail_tables_names = ${JSON.stringify(o.map(d=>d.toLowerCase()))}
        
        for detail_name in detail_tables_names:
            detail_records[detail_name] = data.pop(detail_name, None)
        
        try:
            db_item = db.query(${i}).filter(${i}.id == id).first()
            if not db_item:
                return None
            
            # Update master fields
            for key, value in data.items():
                if value is not None:
                    setattr(db_item, key, value)
            `;for(const d of o){const e=toClassName(d),a=d.toLowerCase();s+=`
            
            # Smart update ${e} details
            if detail_records['${a}'] is not None:
                new_detail_ids = set()
                for detail_data in detail_records['${a}']:
                    if 'id' in detail_data and detail_data['id']:
                        detail_id = detail_data['id']
                        new_detail_ids.add(detail_id)
                        detail_item = db.query(${e}).filter(${e}.id == detail_id).first()
                        if detail_item:
                            for key, value in detail_data.items():
                                if value is not None and key != 'id':
                                    setattr(detail_item, key, value)
                    else:
                        # INSERT new record
                        detail_data_copy = {k: v for k, v in detail_data.items() if k != 'id'}
                        detail_data_copy['master_id'] = id
                        detail_item = ${e}(**detail_data_copy)
                        db.add(detail_item)
                
                # DELETE records not in new list
                if new_detail_ids:
                    db.query(${e}).filter(
                        ${e}.master_id == id,
                        ~${e}.id.in_(new_detail_ids)
                    ).delete(synchronize_session=False)
                else:
                    db.query(${e}).filter(${e}.master_id == id).delete(synchronize_session=False)
            `;}s+=`
            
            db.commit()
            db.refresh(db_item)
            return db_item
        
        except Exception as e:
            db.rollback()
            raise Exception(f"Error updating master with details: {str(e)}")
    
    def delete(self, db: Session, id: int) -> bool:
        """Delete a ${r} record and all related detail records"""
        try:
            db_item = db.query(${i}).filter(${i}.id == id).first()
            if db_item:
                # Delete all detail records directly (without individual commits)
                `;for(const d of o){const e=toClassName(d);s+=`db.query(${e}).filter(${e}.master_id == id).delete(synchronize_session=False)
                `;}s+=`
                # Delete master record
                db.delete(db_item)
                db.commit()
                return True
            return False
        except Exception as e:
            db.rollback()
            raise Exception(f"Error deleting master with details: {str(e)}")
    
    def count(self, db: Session) -> int:
        """Get total count of ${r} records"""
        return db.query(${i}).count()
`;for(const d of o){const e=toClassName(d),a=d.toLowerCase();s+=`
    # ============= DETAIL TABLE: ${e} =============
    
    def get_details_${a}(self, db: Session, master_id: int) -> List[${e}]:
        """Get all ${a} records for a master"""
        return db.query(${e}).filter(${e}.master_id == master_id).all()
    
    def get_detail_${a}(self, db: Session, detail_id: int) -> Optional[${e}]:
        """Get a single ${a} record"""
        return db.query(${e}).filter(${e}.id == detail_id).first()
    
    def create_detail_${a}(self, db: Session, master_id: int, data: dict) -> ${e}:
        """Create a new ${a} record"""
        data['master_id'] = master_id
        db_item = ${e}(**data)
        db.add(db_item)
        db.commit()
        db.refresh(db_item)
        return db_item
    
    def update_detail_${a}(self, db: Session, detail_id: int, data: dict) -> Optional[${e}]:
        """Update a ${a} record"""
        db_item = db.query(${e}).filter(${e}.id == detail_id).first()
        if db_item:
            for key, value in data.items():
                if value is not None and key != 'master_id':
                    setattr(db_item, key, value)
            db.commit()
            db.refresh(db_item)
        return db_item
    
    def delete_detail_${a}(self, db: Session, detail_id: int) -> bool:
        """Delete a ${a} record"""
        db_item = db.query(${e}).filter(${e}.id == detail_id).first()
        if db_item:
            db.delete(db_item)
            db.commit()
            return True
        return False
    
    def count_details_${a}(self, db: Session, master_id: int) -> int:
        """Get count of ${a} records for a master"""
        return db.query(${e}).filter(${e}.master_id == master_id).count()
`;}return s}export{f as generateServiceLayer,_ as generateUnifiedService};