import json

def test_place_order(client):
    r = client.post("/api/orders", json={"customer_name": "Alice", "items": [{"product_id": 1, "quantity": 2}]})
    assert r.status_code == 201
    d = r.get_json()
    assert d["order"]["status"] == "Placed"
    assert d["order"]["ref"].startswith("ORD-")

def test_insufficient_stock(client):
    # product 3 has 0 stock
    r = client.post("/api/orders", json={"customer_name": "Bob", "items": [{"product_id": 3, "quantity": 1}]})
    assert r.status_code == 409
    assert "Insufficient stock" in r.get_json()["message"]

def test_invalid_transition(client):
    r = client.post("/api/orders", json={"customer_name": "C", "items": [{"product_id": 1, "quantity": 1}]})
    ref = r.get_json()["order"]["ref"]
    # ship directly from placed should fail
    r2 = client.post(f"/api/orders/{ref}/status", json={"action": "ship"})
    assert r2.status_code == 409

def test_cancel_exactly_once(client):
    r = client.post("/api/orders", json={"customer_name": "D", "items": [{"product_id": 6, "quantity": 2}]})
    ref = r.get_json()["order"]["ref"]
    r1 = client.post(f"/api/orders/{ref}/status", json={"action": "cancel"})
    assert r1.status_code == 200
    r2 = client.post(f"/api/orders/{ref}/status", json={"action": "cancel"})
    assert r2.status_code == 409

def test_filters(client):
    client.post("/api/orders", json={"customer_name": "Eve", "items": [{"product_id": 1, "quantity": 1}]})
    r = client.get("/api/orders?status=Placed")
    assert r.status_code == 200
    assert len(r.get_json()["orders"]) >= 1
    r2 = client.get("/api/orders?search=Eve")
    assert any(o["customer_name"] == "Eve" for o in r2.get_json()["orders"])
