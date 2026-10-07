import mysql.connector
from decimal import Decimal
import datetime

DB_CONFIG = {
    'host': '127.0.0.1',
    'port': 3306,
    'user': 'root',
    'password': 'Zeeshan@786',
    'database': 'smartnest_db',
    'autocommit': True
}

def get_db_connection():
    """Create and return a MySQL connection."""
    return mysql.connector.connect(**DB_CONFIG)

def serialize_row(row):
    """Convert Decimal and Date/Datetime objects to JSON-serializable types."""
    if not row:
        return row
    serialized = {}
    for key, value in row.items():
        if isinstance(value, Decimal):
            serialized[key] = float(value)
        elif isinstance(value, (datetime.date, datetime.datetime)):
            serialized[key] = value.strftime('%Y-%m-%d')
        else:
            serialized[key] = value
    return serialized

def get_dashboard_metrics():
    """Fetch dashboard statistics directly from MySQL database."""
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    # 1. Total Properties
    cursor.execute("SELECT COUNT(*) as total_properties FROM property;")
    total_properties = cursor.fetchone()['total_properties']
    
    # 2. Total Units
    cursor.execute("SELECT COUNT(*) as total_units FROM unit;")
    total_units = cursor.fetchone()['total_units']
    
    # 3. Unit Status Breakdown
    cursor.execute("SELECT COUNT(*) as available_units FROM unit WHERE LOWER(status) = 'available';")
    available_units = cursor.fetchone()['available_units']
    
    cursor.execute("SELECT COUNT(*) as occupied_units FROM unit WHERE LOWER(status) = 'occupied';")
    occupied_units = cursor.fetchone()['occupied_units']
    
    cursor.execute("SELECT COUNT(*) as maintenance_units FROM unit WHERE LOWER(status) LIKE '%maint%';")
    maintenance_units = cursor.fetchone()['maintenance_units']
    
    # 4. Total Tenants
    cursor.execute("SELECT COUNT(*) as total_tenants FROM tenant;")
    total_tenants = cursor.fetchone()['total_tenants']
    
    # 5. Active Leases
    cursor.execute("SELECT COUNT(*) as active_leases FROM lease WHERE LOWER(status) = 'active';")
    active_leases = cursor.fetchone()['active_leases']
    
    # 6. Recent Lease Activity
    cursor.execute("""
        SELECT l.lease_id, t.name as tenant_name, u.unit_no, p.address as property_address, 
               l.monthly_rent, l.start_date, l.end_date, l.status
        FROM lease l
        JOIN tenant t ON l.tenant_id = t.tenant_id
        JOIN unit u ON l.unit_id = u.unit_id
        JOIN property p ON u.property_id = p.property_id
        ORDER BY l.start_date DESC
        LIMIT 5;
    """)
    recent_leases = [serialize_row(r) for r in cursor.fetchall()]
    
    # 7. Upcoming Lease Expirations
    cursor.execute("""
        SELECT l.lease_id, t.name as tenant_name, u.unit_no, p.address as property_address,
               l.end_date, l.monthly_rent, l.status
        FROM lease l
        JOIN tenant t ON l.tenant_id = t.tenant_id
        JOIN unit u ON l.unit_id = u.unit_id
        JOIN property p ON u.property_id = p.property_id
        WHERE LOWER(l.status) = 'active'
        ORDER BY l.end_date ASC
        LIMIT 5;
    """)
    upcoming_expirations = [serialize_row(r) for r in cursor.fetchall()]

    # 8. Recent Payments Activity
    cursor.execute("""
        SELECT p.payment_id, t.name as tenant_name, u.unit_no, p.amount_paid, p.payment_date, p.mode
        FROM payment p
        JOIN rent_schedule rs ON p.schedule_id = rs.schedule_id
        JOIN lease l ON rs.lease_id = l.lease_id
        JOIN tenant t ON l.tenant_id = t.tenant_id
        JOIN unit u ON l.unit_id = u.unit_id
        ORDER BY p.payment_date DESC
        LIMIT 5;
    """)
    recent_payments = [serialize_row(r) for r in cursor.fetchall()]
    
    cursor.close()
    conn.close()
    
    return {
        'total_properties': total_properties,
        'total_units': total_units,
        'available_units': available_units,
        'occupied_units': occupied_units,
        'maintenance_units': maintenance_units,
        'total_tenants': total_tenants,
        'active_leases': active_leases,
        'recent_leases': recent_leases,
        'upcoming_expirations': upcoming_expirations,
        'recent_payments': recent_payments
    }

# ==============================================================================
# OWNERS HELPERS
# ==============================================================================

def get_all_owners():
    """Fetch all owners for property creation dropdown."""
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT owner_id, name, phone, email, address FROM owner ORDER BY name ASC;")
    owners = [serialize_row(r) for r in cursor.fetchall()]
    cursor.close()
    conn.close()
    return owners

# ==============================================================================
# PROPERTIES CRUD
# ==============================================================================

def get_all_properties(search=None, city=None, property_type=None):
    """Fetch property records with search and filter support."""
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    query = """
        SELECT p.property_id, p.owner_id, o.name as owner_name, o.phone as owner_phone,
               p.address, p.city, p.property_type, COUNT(u.unit_id) as unit_count
        FROM property p
        JOIN owner o ON p.owner_id = o.owner_id
        LEFT JOIN unit u ON p.property_id = u.property_id
        WHERE 1=1
    """
    params = []
    
    if search:
        query += " AND (p.address LIKE %s OR p.city LIKE %s OR o.name LIKE %s OR p.property_type LIKE %s)"
        search_pattern = f"%{search}%"
        params.extend([search_pattern, search_pattern, search_pattern, search_pattern])
        
    if city and city != 'All':
        query += " AND p.city = %s"
        params.append(city)
        
    if property_type and property_type != 'All':
        query += " AND p.property_type = %s"
        params.append(property_type)
        
    query += " GROUP BY p.property_id ORDER BY p.property_id DESC;"
    
    cursor.execute(query, tuple(params))
    properties = [serialize_row(r) for r in cursor.fetchall()]
    
    cursor.close()
    conn.close()
    return properties

def get_property_filters():
    """Fetch distinct cities and property types for dropdown filters."""
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    cursor.execute("SELECT DISTINCT city FROM property WHERE city IS NOT NULL AND city != '' ORDER BY city ASC;")
    cities = [r['city'] for r in cursor.fetchall()]
    
    cursor.execute("SELECT DISTINCT property_type FROM property WHERE property_type IS NOT NULL AND property_type != '' ORDER BY property_type ASC;")
    types = [r['property_type'] for r in cursor.fetchall()]
    
    cursor.close()
    conn.close()
    return {'cities': cities, 'property_types': types}

def get_property_by_id(property_id):
    """Fetch property detail by ID along with its associated units."""
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    cursor.execute("""
        SELECT p.property_id, p.owner_id, o.name as owner_name, o.phone as owner_phone, o.email as owner_email,
               p.address, p.city, p.property_type
        FROM property p
        JOIN owner o ON p.owner_id = o.owner_id
        WHERE p.property_id = %s;
    """, (property_id,))
    prop = cursor.fetchone()
    
    if not prop:
        cursor.close()
        conn.close()
        return None
        
    prop = serialize_row(prop)
    
    # Fetch units for this property
    cursor.execute("""
        SELECT unit_id, unit_no, floor, bedrooms, rent_amount, status
        FROM unit
        WHERE property_id = %s
        ORDER BY unit_no ASC;
    """, (property_id,))
    prop['units'] = [serialize_row(u) for u in cursor.fetchall()]
    
    cursor.close()
    conn.close()
    return prop

def add_property(owner_id, address, city, property_type):
    """Insert a new property record into MySQL."""
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("""
            INSERT INTO property (owner_id, address, city, property_type)
            VALUES (%s, %s, %s, %s);
        """, (owner_id, address, city, property_type))
        conn.commit()
        new_id = cursor.lastrowid
        cursor.close()
        conn.close()
        return {'success': True, 'property_id': new_id, 'message': 'Property added successfully!'}
    except mysql.connector.Error as err:
        cursor.close()
        conn.close()
        return {'success': False, 'message': f'Database error: {err.msg}'}

def delete_property(property_id):
    """Delete a property record from MySQL, handling FK constraints."""
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("DELETE FROM property WHERE property_id = %s;", (property_id,))
        conn.commit()
        affected = cursor.rowcount
        cursor.close()
        conn.close()
        if affected > 0:
            return {'success': True, 'message': f'Property #{property_id} deleted successfully.'}
        else:
            return {'success': False, 'message': f'Property #{property_id} not found.'}
    except mysql.connector.Error as err:
        cursor.close()
        conn.close()
        if err.errno == 1451:
            return {
                'success': False,
                'message': 'Cannot delete property: Units exist for this property. Please delete or reassign associated units first.'
            }
        return {'success': False, 'message': f'Database error: {err.msg}'}

# ==============================================================================
# UNITS CRUD
# ==============================================================================

def get_all_units(search=None, property_id=None, status=None):
    """Fetch unit records with search, property, and status filtering."""
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    query = """
        SELECT u.unit_id, u.property_id, p.address as property_address, p.city,
               u.unit_no, u.floor, u.bedrooms, u.rent_amount, u.status, o.name as owner_name
        FROM unit u
        JOIN property p ON u.property_id = p.property_id
        JOIN owner o ON p.owner_id = o.owner_id
        WHERE 1=1
    """
    params = []
    
    if search:
        query += " AND (u.unit_no LIKE %s OR p.address LIKE %s OR p.city LIKE %s OR u.status LIKE %s)"
        sp = f"%{search}%"
        params.extend([sp, sp, sp, sp])
        
    if property_id and str(property_id) != 'All':
        query += " AND u.property_id = %s"
        params.append(property_id)
        
    if status and status != 'All':
        query += " AND u.status = %s"
        params.append(status)
        
    query += " ORDER BY u.unit_id DESC;"
    
    cursor.execute(query, tuple(params))
    units = [serialize_row(r) for r in cursor.fetchall()]
    
    cursor.close()
    conn.close()
    return units

def get_unit_by_id(unit_id):
    """Fetch unit detail by ID along with property information and active lease if occupied."""
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    cursor.execute("""
        SELECT u.unit_id, u.property_id, p.address as property_address, p.city, p.property_type,
               u.unit_no, u.floor, u.bedrooms, u.rent_amount, u.status, o.name as owner_name, o.phone as owner_phone
        FROM unit u
        JOIN property p ON u.property_id = p.property_id
        JOIN owner o ON p.owner_id = o.owner_id
        WHERE u.unit_id = %s;
    """, (unit_id,))
    unit = cursor.fetchone()
    
    if not unit:
        cursor.close()
        conn.close()
        return None
        
    unit = serialize_row(unit)
    
    # Check for active lease
    cursor.execute("""
        SELECT l.lease_id, t.name as tenant_name, t.phone as tenant_phone, l.start_date, l.end_date, l.monthly_rent
        FROM lease l
        JOIN tenant t ON l.tenant_id = t.tenant_id
        WHERE l.unit_id = %s AND LOWER(l.status) = 'active'
        LIMIT 1;
    """, (unit_id,))
    active_lease = cursor.fetchone()
    if active_lease:
        unit['active_lease'] = serialize_row(active_lease)
    else:
        unit['active_lease'] = None
        
    cursor.close()
    conn.close()
    return unit

def add_unit(property_id, unit_no, floor, bedrooms, rent_amount, status):
    """Insert a new unit record into MySQL."""
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("""
            INSERT INTO unit (property_id, unit_no, floor, bedrooms, rent_amount, status)
            VALUES (%s, %s, %s, %s, %s, %s);
        """, (property_id, unit_no, floor, bedrooms, rent_amount, status))
        conn.commit()
        new_id = cursor.lastrowid
        cursor.close()
        conn.close()
        return {'success': True, 'unit_id': new_id, 'message': 'Unit added successfully!'}
    except mysql.connector.Error as err:
        cursor.close()
        conn.close()
        return {'success': False, 'message': f'Database error: {err.msg}'}

def delete_unit(unit_id):
    """Delete a unit record from MySQL, handling FK constraints."""
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("DELETE FROM unit WHERE unit_id = %s;", (unit_id,))
        conn.commit()
        affected = cursor.rowcount
        cursor.close()
        conn.close()
        if affected > 0:
            return {'success': True, 'message': f'Unit #{unit_id} deleted successfully.'}
        else:
            return {'success': False, 'message': f'Unit #{unit_id} not found.'}
    except mysql.connector.Error as err:
        cursor.close()
        conn.close()
        if err.errno == 1451:
            return {
                'success': False,
                'message': 'Cannot delete unit: Existing leases or maintenance records reference this unit.'
            }
        return {'success': False, 'message': f'Database error: {err.msg}'}

# ==============================================================================
# TENANTS CRUD
# ==============================================================================

def get_all_tenants(search=None):
    """Fetch all tenant records with optional search."""
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    query = "SELECT tenant_id, name, phone, email, id_proof_no FROM tenant WHERE 1=1"
    params = []
    if search:
        sp = f"%{search}%"
        query += " AND (name LIKE %s OR phone LIKE %s OR email LIKE %s OR id_proof_no LIKE %s)"
        params.extend([sp, sp, sp, sp])
    query += " ORDER BY tenant_id DESC;"
    cursor.execute(query, tuple(params))
    tenants = cursor.fetchall()
    cursor.close()
    conn.close()
    return tenants

def get_tenant_by_id(tenant_id):
    """Fetch a single tenant and their lease history."""
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute(
        "SELECT tenant_id, name, phone, email, id_proof_no FROM tenant WHERE tenant_id = %s;",
        (tenant_id,)
    )
    tenant = cursor.fetchone()
    if not tenant:
        cursor.close()
        conn.close()
        return None
    cursor.execute("""
        SELECT l.lease_id, u.unit_no, p.address as property_address, p.city,
               l.start_date, l.end_date, l.monthly_rent, l.status
        FROM lease l
        JOIN unit u ON l.unit_id = u.unit_id
        JOIN property p ON u.property_id = p.property_id
        WHERE l.tenant_id = %s
        ORDER BY l.start_date DESC;
    """, (tenant_id,))
    tenant['lease_history'] = [serialize_row(r) for r in cursor.fetchall()]
    cursor.close()
    conn.close()
    return tenant

def add_tenant(name, phone, email, id_proof_no):
    """Insert a new tenant into MySQL."""
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            "INSERT INTO tenant (name, phone, email, id_proof_no) VALUES (%s, %s, %s, %s);",
            (name, phone or None, email or None, id_proof_no or None)
        )
        conn.commit()
        new_id = cursor.lastrowid
        cursor.close()
        conn.close()
        return {'success': True, 'tenant_id': new_id, 'message': 'Tenant added successfully!'}
    except mysql.connector.Error as err:
        cursor.close()
        conn.close()
        return {'success': False, 'message': f'Database error: {err.msg}'}

def delete_tenant(tenant_id):
    """Delete a tenant from MySQL, respecting FK constraints."""
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("DELETE FROM tenant WHERE tenant_id = %s;", (tenant_id,))
        conn.commit()
        affected = cursor.rowcount
        cursor.close()
        conn.close()
        if affected > 0:
            return {'success': True, 'message': f'Tenant #{tenant_id} deleted successfully.'}
        return {'success': False, 'message': f'Tenant #{tenant_id} not found.'}
    except mysql.connector.Error as err:
        cursor.close()
        conn.close()
        if err.errno == 1451:
            return {
                'success': False,
                'message': 'Cannot delete tenant: Active lease or maintenance records exist. Remove those first.'
            }
        return {'success': False, 'message': f'Database error: {err.msg}'}

# ==============================================================================
# LEASES CRUD
# ==============================================================================

def get_all_leases(search=None, status=None):
    """Fetch all leases with tenant/unit details, optional search/status filter."""
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    query = """
        SELECT l.lease_id, l.unit_id, l.tenant_id,
               t.name AS tenant_name, t.phone AS tenant_phone,
               u.unit_no, p.address AS property_address, p.city,
               l.start_date, l.end_date, l.monthly_rent, l.status
        FROM lease l
        JOIN tenant t ON l.tenant_id = t.tenant_id
        JOIN unit u ON l.unit_id = u.unit_id
        JOIN property p ON u.property_id = p.property_id
        WHERE 1=1
    """
    params = []
    if search:
        sp = f'%{search}%'
        query += " AND (t.name LIKE %s OR u.unit_no LIKE %s OR p.address LIKE %s)"
        params.extend([sp, sp, sp])
    if status and status != 'All':
        query += " AND l.status = %s"
        params.append(status)
    query += " ORDER BY l.lease_id DESC;"
    cursor.execute(query, tuple(params))
    leases = [serialize_row(r) for r in cursor.fetchall()]
    cursor.close()
    conn.close()
    return leases

def get_lease_by_id(lease_id):
    """Fetch single lease with full details."""
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("""
        SELECT l.lease_id, l.unit_id, l.tenant_id,
               t.name AS tenant_name, t.phone AS tenant_phone, t.email AS tenant_email,
               u.unit_no, u.floor, u.bedrooms, u.rent_amount,
               p.address AS property_address, p.city, p.property_type,
               l.start_date, l.end_date, l.monthly_rent, l.status
        FROM lease l
        JOIN tenant t ON l.tenant_id = t.tenant_id
        JOIN unit u ON l.unit_id = u.unit_id
        JOIN property p ON u.property_id = p.property_id
        WHERE l.lease_id = %s;
    """, (lease_id,))
    row = cursor.fetchone()
    cursor.close()
    conn.close()
    return serialize_row(row) if row else None

def create_lease(unit_id, tenant_id, start_date, end_date, monthly_rent):
    """Call the create_lease stored procedure."""
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.callproc('create_lease', [unit_id, tenant_id, start_date, end_date, monthly_rent])
        conn.commit()
        # Get the new lease_id
        cursor2 = conn.cursor(dictionary=True)
        cursor2.execute("""
            SELECT lease_id FROM lease
            WHERE unit_id=%s AND tenant_id=%s AND start_date=%s
            ORDER BY lease_id DESC LIMIT 1;
        """, (unit_id, tenant_id, start_date))
        row = cursor2.fetchone()
        cursor2.close()
        cursor.close()
        conn.close()
        new_id = row['lease_id'] if row else None
        return {'success': True, 'message': 'Lease created successfully!', 'lease_id': new_id}
    except mysql.connector.Error as err:
        cursor.close()
        conn.close()
        return {'success': False, 'message': err.msg}

# ==============================================================================
# RENT & PAYMENTS
# ==============================================================================

def get_rent_and_payments(search=None, status=None):
    """Fetch rent schedules joined with payment info."""
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    query = """
        SELECT rs.schedule_id, rs.lease_id, rs.due_date, rs.amount_due, rs.status,
               t.name AS tenant_name, u.unit_no, p.address AS property_address,
               pay.amount_paid, pay.payment_date, pay.mode
        FROM rent_schedule rs
        JOIN lease l ON rs.lease_id = l.lease_id
        JOIN tenant t ON l.tenant_id = t.tenant_id
        JOIN unit u ON l.unit_id = u.unit_id
        JOIN property p ON u.property_id = p.property_id
        LEFT JOIN payment pay ON pay.schedule_id = rs.schedule_id
        WHERE 1=1
    """
    params = []
    if search:
        sp = f'%{search}%'
        query += " AND (t.name LIKE %s OR u.unit_no LIKE %s)"
        params.extend([sp, sp])
    if status and status != 'All':
        query += " AND rs.status = %s"
        params.append(status)
    query += " ORDER BY rs.due_date DESC;"
    cursor.execute(query, tuple(params))
    rows = [serialize_row(r) for r in cursor.fetchall()]
    cursor.close()
    conn.close()
    return rows

# ==============================================================================
# MAINTENANCE
# ==============================================================================

def get_all_maintenance(search=None, status=None):
    """Fetch maintenance requests with unit/tenant info."""
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    query = """
        SELECT mr.request_id, mr.unit_id, mr.tenant_id,
               t.name AS tenant_name, u.unit_no, p.address AS property_address,
               mr.request_date, mr.description, mr.status, mr.cost
        FROM maintenance_request mr
        JOIN tenant t ON mr.tenant_id = t.tenant_id
        JOIN unit u ON mr.unit_id = u.unit_id
        JOIN property p ON u.property_id = p.property_id
        WHERE 1=1
    """
    params = []
    if search:
        sp = f'%{search}%'
        query += " AND (t.name LIKE %s OR u.unit_no LIKE %s OR mr.description LIKE %s)"
        params.extend([sp, sp, sp])
    if status and status != 'All':
        query += " AND mr.status = %s"
        params.append(status)
    query += " ORDER BY mr.request_date DESC;"
    cursor.execute(query, tuple(params))
    rows = [serialize_row(r) for r in cursor.fetchall()]
    cursor.close()
    conn.close()
    return rows

def get_maintenance_by_id(req_id):
    """Fetch single maintenance request detail."""
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("""
        SELECT mr.request_id, mr.unit_id, mr.tenant_id,
               t.name AS tenant_name, t.phone AS tenant_phone,
               u.unit_no, p.address AS property_address, p.city,
               mr.request_date, mr.description, mr.status, mr.cost
        FROM maintenance_request mr
        JOIN tenant t ON mr.tenant_id = t.tenant_id
        JOIN unit u ON mr.unit_id = u.unit_id
        JOIN property p ON u.property_id = p.property_id
        WHERE mr.request_id = %s;
    """, (req_id,))
    row = cursor.fetchone()
    cursor.close()
    conn.close()
    return serialize_row(row) if row else None

# ==============================================================================
# REPORTS (DB Views)
# ==============================================================================

def get_report(view_name):
    """Fetch all rows from a named database view."""
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute(f"SELECT * FROM `{view_name}`;")
    rows = [serialize_row(r) for r in cursor.fetchall()]
    cursor.close()
    conn.close()
    return rows
