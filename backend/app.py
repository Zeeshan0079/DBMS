import os
import sys
from flask import Flask, render_template, jsonify, request

# Ensure backend directory is in sys.path
backend_dir = os.path.dirname(os.path.abspath(__file__))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

# Resolve path to frontend templates and static
base_dir = os.path.dirname(backend_dir)
template_dir = os.path.join(base_dir, 'frontend', 'templates')
static_dir = os.path.join(base_dir, 'frontend', 'static')

app = Flask(
    __name__,
    template_folder=template_dir,
    static_folder=static_dir
)

import db

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/dashboard')
def api_dashboard():
    try:
        data = db.get_dashboard_metrics()
        return jsonify({'status': 'success', 'data': data})
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/api/db-status')
def api_db_status():
    try:
        conn = db.get_db_connection()
        conn.close()
        return jsonify({'status': 'online', 'database': 'smartnest_db', 'host': '127.0.0.1:3306'})
    except Exception as e:
        return jsonify({'status': 'offline', 'error': str(e)}), 500

# ==============================================================================
# OWNERS API
# ==============================================================================

@app.route('/api/owners')
def api_owners():
    try:
        owners = db.get_all_owners()
        return jsonify({'status': 'success', 'data': owners})
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

# ==============================================================================
# PROPERTIES API
# ==============================================================================

@app.route('/api/properties', methods=['GET'])
def api_properties_list():
    try:
        search = request.args.get('search', '').strip()
        city = request.args.get('city', '').strip()
        property_type = request.args.get('type', '').strip()
        
        properties = db.get_all_properties(search=search, city=city, property_type=property_type)
        return jsonify({'status': 'success', 'data': properties})
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/api/properties/filters')
def api_properties_filters():
    try:
        filters = db.get_property_filters()
        return jsonify({'status': 'success', 'data': filters})
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/api/properties/<int:prop_id>', methods=['GET'])
def api_property_detail(prop_id):
    try:
        prop = db.get_property_by_id(prop_id)
        if not prop:
            return jsonify({'status': 'error', 'message': 'Property not found'}), 404
        return jsonify({'status': 'success', 'data': prop})
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/api/properties', methods=['POST'])
def api_property_add():
    try:
        req_data = request.get_json() or {}
        owner_id = req_data.get('owner_id')
        address = req_data.get('address', '').strip()
        city = req_data.get('city', '').strip()
        property_type = req_data.get('property_type', '').strip()

        if not owner_id or not address or not city or not property_type:
            return jsonify({'status': 'error', 'message': 'All fields (Owner, Address, City, Property Type) are required.'}), 400

        res = db.add_property(owner_id, address, city, property_type)
        if res['success']:
            return jsonify({'status': 'success', 'message': res['message'], 'property_id': res['property_id']})
        else:
            return jsonify({'status': 'error', 'message': res['message']}), 400
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/api/properties/<int:prop_id>', methods=['DELETE'])
def api_property_delete(prop_id):
    try:
        res = db.delete_property(prop_id)
        if res['success']:
            return jsonify({'status': 'success', 'message': res['message']})
        else:
            return jsonify({'status': 'error', 'message': res['message']}), 400
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

# ==============================================================================
# UNITS API
# ==============================================================================

@app.route('/api/units', methods=['GET'])
def api_units_list():
    try:
        search = request.args.get('search', '').strip()
        property_id = request.args.get('property_id', '').strip()
        status = request.args.get('status', '').strip()
        
        units = db.get_all_units(search=search, property_id=property_id, status=status)
        return jsonify({'status': 'success', 'data': units})
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/api/units/<int:unit_id>', methods=['GET'])
def api_unit_detail(unit_id):
    try:
        unit = db.get_unit_by_id(unit_id)
        if not unit:
            return jsonify({'status': 'error', 'message': 'Unit not found'}), 404
        return jsonify({'status': 'success', 'data': unit})
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/api/units', methods=['POST'])
def api_unit_add():
    try:
        req_data = request.get_json() or {}
        property_id = req_data.get('property_id')
        unit_no = req_data.get('unit_no', '').strip()
        floor = req_data.get('floor')
        bedrooms = req_data.get('bedrooms')
        rent_amount = req_data.get('rent_amount')
        status = req_data.get('status', 'Available').strip()

        if not property_id or not unit_no or rent_amount is None:
            return jsonify({'status': 'error', 'message': 'Property, Unit Number, and Rent Amount are required.'}), 400

        try:
            floor = int(floor) if floor is not None and str(floor).strip() != '' else 1
            bedrooms = int(bedrooms) if bedrooms is not None and str(bedrooms).strip() != '' else 1
            rent_amount = float(rent_amount)
        except ValueError:
            return jsonify({'status': 'error', 'message': 'Invalid numeric values for floor, bedrooms, or rent.'}), 400

        res = db.add_unit(property_id, unit_no, floor, bedrooms, rent_amount, status)
        if res['success']:
            return jsonify({'status': 'success', 'message': res['message'], 'unit_id': res['unit_id']})
        else:
            return jsonify({'status': 'error', 'message': res['message']}), 400
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/api/units/<int:unit_id>', methods=['DELETE'])
def api_unit_delete(unit_id):
    try:
        res = db.delete_unit(unit_id)
        if res['success']:
            return jsonify({'status': 'success', 'message': res['message']})
        else:
            return jsonify({'status': 'error', 'message': res['message']}), 400
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

# ==============================================================================
# TENANTS API
# ==============================================================================

@app.route('/api/tenants', methods=['GET'])
def api_tenants_list():
    try:
        search = request.args.get('search', '').strip()
        tenants = db.get_all_tenants(search=search)
        return jsonify({'status': 'success', 'data': tenants})
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/api/tenants/<int:tenant_id>', methods=['GET'])
def api_tenant_detail(tenant_id):
    try:
        tenant = db.get_tenant_by_id(tenant_id)
        if not tenant:
            return jsonify({'status': 'error', 'message': 'Tenant not found'}), 404
        return jsonify({'status': 'success', 'data': tenant})
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/api/tenants', methods=['POST'])
def api_tenant_add():
    try:
        req_data = request.get_json() or {}
        name = req_data.get('name', '').strip()
        phone = req_data.get('phone', '').strip()
        email = req_data.get('email', '').strip()
        id_proof_no = req_data.get('id_proof_no', '').strip()
        if not name:
            return jsonify({'status': 'error', 'message': 'Tenant name is required.'}), 400
        res = db.add_tenant(name, phone, email, id_proof_no)
        if res['success']:
            return jsonify({'status': 'success', 'message': res['message'], 'tenant_id': res['tenant_id']})
        return jsonify({'status': 'error', 'message': res['message']}), 400
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/api/tenants/<int:tenant_id>', methods=['DELETE'])
def api_tenant_delete(tenant_id):
    try:
        res = db.delete_tenant(tenant_id)
        if res['success']:
            return jsonify({'status': 'success', 'message': res['message']})
        return jsonify({'status': 'error', 'message': res['message']}), 400
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

# ==============================================================================
# LEASES API
# ==============================================================================

@app.route('/api/leases', methods=['GET'])
def api_leases_list():
    try:
        search = request.args.get('search', '').strip()
        status = request.args.get('status', '').strip()
        leases = db.get_all_leases(search=search, status=status)
        return jsonify({'status': 'success', 'data': leases})
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/api/leases/<int:lease_id>', methods=['GET'])
def api_lease_detail(lease_id):
    try:
        lease = db.get_lease_by_id(lease_id)
        if not lease:
            return jsonify({'status': 'error', 'message': 'Lease not found'}), 404
        return jsonify({'status': 'success', 'data': lease})
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/api/leases', methods=['POST'])
def api_lease_create():
    try:
        d = request.get_json() or {}
        unit_id = d.get('unit_id')
        tenant_id = d.get('tenant_id')
        start_date = d.get('start_date', '').strip()
        end_date = d.get('end_date', '').strip()
        monthly_rent = d.get('monthly_rent')
        if not all([unit_id, tenant_id, start_date, end_date, monthly_rent]):
            return jsonify({'status': 'error', 'message': 'All fields are required.'}), 400
        res = db.create_lease(unit_id, tenant_id, start_date, end_date, float(monthly_rent))
        if res['success']:
            return jsonify({'status': 'success', 'message': res['message'], 'lease_id': res.get('lease_id')})
        return jsonify({'status': 'error', 'message': res['message']}), 400
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

# ==============================================================================
# RENT & PAYMENTS API
# ==============================================================================

@app.route('/api/payments', methods=['GET'])
def api_payments_list():
    try:
        search = request.args.get('search', '').strip()
        status = request.args.get('status', '').strip()
        data = db.get_rent_and_payments(search=search, status=status)
        return jsonify({'status': 'success', 'data': data})
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

# ==============================================================================
# MAINTENANCE API
# ==============================================================================

@app.route('/api/maintenance', methods=['GET'])
def api_maintenance_list():
    try:
        search = request.args.get('search', '').strip()
        status = request.args.get('status', '').strip()
        data = db.get_all_maintenance(search=search, status=status)
        return jsonify({'status': 'success', 'data': data})
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/api/maintenance/<int:req_id>', methods=['GET'])
def api_maintenance_detail(req_id):
    try:
        data = db.get_maintenance_by_id(req_id)
        if not data:
            return jsonify({'status': 'error', 'message': 'Request not found'}), 404
        return jsonify({'status': 'success', 'data': data})
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

# ==============================================================================
# REPORTS API
# ==============================================================================

@app.route('/api/reports/<string:report_name>', methods=['GET'])
def api_report(report_name):
    allowed = {'vacant_units', 'due_rent', 'lease_expiry_report', 'owner_income', 'tenant_history'}
    if report_name not in allowed:
        return jsonify({'status': 'error', 'message': 'Unknown report'}), 404
    try:
        data = db.get_report(report_name)
        return jsonify({'status': 'success', 'data': data})
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

if __name__ == '__main__':
    print("Starting PropertyDesk Server on http://127.0.0.1:5000 ...")
    app.run(host='127.0.0.1', port=5000, debug=True)
