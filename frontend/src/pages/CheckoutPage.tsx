import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { clearCart, getCart } from '../services/cart';
import { createSale, getCustomers } from '../services/api';
import { SectionPage } from '../components/SectionPage';

export function CheckoutPage() {
  const [cart, setCart] = useState(getCart());
  const [customers, setCustomers] = useState<Array<{ id: number; name: string }>>([]);
  const [customerId, setCustomerId] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    getCustomers().then((items) => {
      setCustomers(items);
      if (items[0]) {
        setCustomerId(String(items[0].id));
      }
    });
  }, []);

  const subtotal = useMemo(() => cart.reduce((total, item) => total + item.unitPrice * item.quantity, 0), [cart]);

  const handleCheckout = async () => {
    const created = await createSale({
      customerId: Number(customerId),
      lines: cart.map((item) => ({ productId: item.productId, quantity: item.quantity, unitPrice: item.unitPrice, discountPercent: 0, vatPercent: 0 }))
    });
    clearCart();
    setCart([]);
    setMessage(`Invoice created: ${created.invoiceNumber ?? created.invoiceNumber ?? 'Success'}`);
    navigate(`/invoice?type=sale&id=${created.id}`, { replace: true });
  };

  return (
    <SectionPage kicker="Storefront" title="Checkout" description="Finalize a customer order and generate the invoice.">
      <div className="panel product-workspace">
        <div className="form-grid">
          <label>
            <span>Customer</span>
            <select value={customerId} onChange={(event) => setCustomerId(event.target.value)}>
              <option value="">Select customer</option>
              {customers.map((customer) => <option key={customer.id} value={customer.id}>{customer.name}</option>)}
            </select>
          </label>
          <label>
            <span>Total items</span>
            <input value={cart.length} readOnly />
          </label>
        </div>
        <div className="panel" style={{ marginTop: 16 }}>
          <strong>Subtotal: {subtotal.toFixed(2)}</strong>
        </div>
        <div className="form-actions">
          <button className="primary-btn" type="button" onClick={handleCheckout} disabled={cart.length === 0}>Place Order</button>
          <Link to="/cart" className="secondary-btn">Back to Cart</Link>
        </div>
        {message ? <div className="form-success" style={{ marginTop: 12 }}>{message}</div> : null}
      </div>
    </SectionPage>
  );
}