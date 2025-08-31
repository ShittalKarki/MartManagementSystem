import { Minus, Plus, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { clearCart, getCart, removeFromCart, updateCartQuantity, CartLine } from '../services/cart';
import { SectionPage } from '../components/SectionPage';
import { Link } from 'react-router-dom';

export function CartPage() {
  const [cart, setCart] = useState<CartLine[]>([]);

  const refresh = () => setCart(getCart());

  useEffect(() => {
    refresh();
  }, []);

  const subtotal = cart.reduce((total, item) => total + item.unitPrice * item.quantity, 0);

  return (
    <SectionPage kicker="Storefront" title="Cart" description="Review selected products before checkout.">
      <div className="panel table-panel">
        <table className="erp-table">
          <thead><tr><th>Item</th><th>Qty</th><th>Price</th><th>Line Total</th><th>Actions</th></tr></thead>
          <tbody>
            {cart.map((item) => (
              <tr key={item.productId}>
                <td>{item.name}</td>
                <td>{item.quantity}</td>
                <td>{Number(item.unitPrice).toLocaleString()}</td>
                <td>{Number(item.unitPrice * item.quantity).toLocaleString()}</td>
                <td>
                  <div className="row-actions">
                    <button className="ghost-btn" type="button" onClick={() => { updateCartQuantity(item.productId, item.quantity + 1); refresh(); }}><Plus size={14} /> +</button>
                    <button className="ghost-btn" type="button" onClick={() => { updateCartQuantity(item.productId, Math.max(1, item.quantity - 1)); refresh(); }}><Minus size={14} /> -</button>
                    <button className="ghost-btn danger" type="button" onClick={() => { removeFromCart(item.productId); refresh(); }}><Trash2 size={14} /> Remove</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="panel" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div><strong>Subtotal: {subtotal.toFixed(2)}</strong></div>
        <div className="form-actions">
          <button className="secondary-btn" type="button" onClick={() => { clearCart(); refresh(); }}>Clear Cart</button>
          <Link to="/checkout" className="primary-btn">Checkout</Link>
        </div>
      </div>
    </SectionPage>
  );
}