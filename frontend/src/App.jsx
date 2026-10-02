import { useEffect, useState } from 'react'
import { request } from './api'
import './App.css'
const blank = { product_name: '', description: '', price: '', quantity: '' }
const money = value => new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(value)
function App() {
  const [session, setSession] = useState(() => { try { return JSON.parse(sessionStorage.getItem('session')) } catch { return null } })
  const [register, setRegister] = useState(false)
  const [products, setProducts] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [editor, setEditor] = useState(null)
  const [form, setForm] = useState(blank)
  const [remove, setRemove] = useState(null)
  const [details, setDetails] = useState(null)
  const isAdmin = session?.user?.role === 'admin'
  function clearSession() { sessionStorage.removeItem('session'); setSession(null); setProducts([]); setEditor(null); setRemove(null); setDetails(null) }
  function handleError(e) { setError(e.message); if (e.status === 401 && session) clearSession() }
  async function load() {
    setLoading(true)
    try { setProducts(await request('/products', { token: session.access_token })) }
    catch (e) { handleError(e) }
    finally { setLoading(false) }
  }
  useEffect(() => {
    if (!session) return
    let active = true
    Promise.all([request('/products', { token: session.access_token }), request('/auth/me', { token: session.access_token })]).then(([data, user]) => {
      if (!active) return
      setProducts(data)
      if (session.user.role !== user.role) {
        const updated = { ...session, user }
        sessionStorage.setItem('session', JSON.stringify(updated)); setSession(updated)
        if (user.role !== 'admin') { setEditor(null); setRemove(null) }
      }
    }).catch(e => {
      if (!active) return
      setError(e.message)
      if (e.status === 401) {
        sessionStorage.removeItem('session'); setSession(null); setProducts([]); setEditor(null); setRemove(null); setDetails(null)
      }
    }).finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [session])
  useEffect(() => {
    if (!editor && !remove && !details) return
    const close = e => { if (e.key === 'Escape' && !busy) { setEditor(null); setRemove(null); setDetails(null) } }
    window.addEventListener('keydown', close)
    return () => window.removeEventListener('keydown', close)
  }, [editor, remove, details, busy])
  async function authenticate(e) {
    e.preventDefault(); setBusy(true); setError(''); setNotice('')
    const fields = Object.fromEntries(new FormData(e.currentTarget))
    try {
      const data = await request(`/auth/${register ? 'register' : 'login'}`, { method: 'POST', body: JSON.stringify(fields) })
      if (register) { setRegister(false); setNotice(data.message) }
      else { sessionStorage.setItem('session', JSON.stringify(data)); setLoading(true); setSession(data) }
    } catch (err) { handleError(err) } finally { setBusy(false) }
  }
  async function logout() {
    setBusy(true); setError('')
    try { await request('/auth/logout', { method: 'POST', token: session.access_token }); clearSession() }
    catch (e) { handleError(e) } finally { setBusy(false) }
  }
  function openEditor(product) { if (!isAdmin) return; setForm(product ? { ...product } : { ...blank }); setEditor(product ? 'edit' : 'add'); setError(''); setNotice('') }
  async function save(e) {
    e.preventDefault(); if (!isAdmin) return; setBusy(true); setError('')
    try {
      const data = await request(editor === 'edit' ? `/products/${form.id}` : '/products', { method: editor === 'edit' ? 'PUT' : 'POST', token: session.access_token, body: JSON.stringify(form) })
      setProducts(previous => editor === 'edit' ? previous.map(p => p.id === data.id ? data : p) : [data, ...previous])
      setNotice(editor === 'edit' ? 'Product updated.' : 'Product added.'); setEditor(null)
    } catch (err) { handleError(err) } finally { setBusy(false) }
  }
  async function deleteProduct() {
    if (!isAdmin) return
    setBusy(true); setError('')
    try { await request(`/products/${remove.id}`, { method: 'DELETE', token: session.access_token }); setProducts(previous => previous.filter(p => p.id !== remove.id)); setRemove(null); setNotice('Product deleted.') }
    catch (e) { handleError(e) } finally { setBusy(false) }
  }
  const filtered = products.filter(p => `${p.product_name} ${p.description}`.toLowerCase().includes(search.toLowerCase()))
  const alerts = <>{error && <div className="alert error" role="alert">{error}</div>}{notice && <div className="alert success" role="status">{notice}</div>}</>
  if (!session) return <main className="auth-layout"><section className="intro"><div className="brand"><span className="brand-mark">S</span> Stockroom</div><div><span className="eyebrow">YOUR INVENTORY, IN ORDER</span><h1>A little order.<br />A lot more clarity.</h1><p>Keep your products, prices, and stock in one simple workspace.</p></div><small>Product management / Laboratory Exercise 06</small></section><section className="login-panel"><div className="auth-card"><span className="eyebrow">LET'S GET STARTED</span><h2>{register ? 'Create your account' : 'Welcome back'}</h2><p>{register ? 'Set up your workspace access.' : 'Sign in to manage your product inventory.'}</p>{alerts}<form onSubmit={authenticate}><label>Username<input name="username" autoComplete="username" required minLength={3} maxLength={50} autoFocus /></label>{register && <label>Email<input name="email" type="email" autoComplete="email" required /></label>}{register && <label>Role<select name="role" defaultValue="user"><option value="user">User (view only)</option><option value="admin">Admin (CRUD and analytics)</option></select></label>}<label>Password<input name="password" type="password" autoComplete={register ? 'new-password' : 'current-password'} required minLength={register ? 8 : 1} maxLength={72} /></label><button className="primary full" disabled={busy}>{busy ? 'Please wait...' : register ? 'Create account' : 'Sign in →'}</button></form><p className="switch">{register ? 'Already have an account?' : 'New here?'} <button className="text-button" disabled={busy} onClick={() => { setRegister(!register); setError(''); setNotice('') }}>{register ? 'Sign in' : 'Create an account'}</button></p><p className="switch"><a href="https://api-tester.marasigan.dev/" target="_blank" rel="noopener noreferrer">Test API routes</a></p></div></section></main>
  return <div className="workspace"><header><div className="brand"><span className="brand-mark">S</span> Stockroom <span className="workspace-label">/ Inventory</span></div><div className="account"><a href="https://api-tester.marasigan.dev/" target="_blank" rel="noopener noreferrer">Test API routes</a><span>{session.user.username}</span><span className="badge">{isAdmin ? 'Admin' : 'User ? View only'}</span><button disabled={busy} onClick={logout}>Log out</button></div></header><main className="dashboard"><div className="page-heading"><div><span className="eyebrow">YOUR WORKSPACE</span><h1>Product inventory</h1><p>A clear view of what you have, and what comes next.</p></div>{isAdmin && <button className="primary" onClick={() => openEditor(null)}>+ Add product</button>}</div>{!editor && !remove && alerts}{isAdmin && <section className="stats" aria-label="Inventory analytics"><article><span>Total products</span><strong>{products.length}</strong><small>In your catalog</small></article><article><span>Units in stock</span><strong>{products.reduce((sum,p) => sum + Number(p.quantity),0).toLocaleString()}</strong><small>Across all products</small></article><article><span>Inventory value</span><strong>{money(products.reduce((sum,p) => sum + Number(p.price)*Number(p.quantity),0))}</strong><small>Based on current prices</small></article></section>}{isAdmin && <section className="analytics-details"><h2>Stock analytics</h2><div className="stats"><article><span>Low stock</span><strong>{products.filter(p => Number(p.quantity) > 0 && Number(p.quantity) < 10).length}</strong><small>Products with fewer than 10 units</small></article><article><span>Out of stock</span><strong>{products.filter(p => Number(p.quantity) === 0).length}</strong><small>Products needing replenishment</small></article><article><span>Highest inventory value</span><strong>{money(Math.max(0, ...products.map(p => Number(p.price) * Number(p.quantity))))}</strong><small>{[...products].sort((a,b) => Number(b.price)*Number(b.quantity) - Number(a.price)*Number(a.quantity))[0]?.product_name || 'No products'}</small></article></div></section>}<section className="catalog"><div className="catalog-toolbar"><h2>All products <span className="count">{products.length}</span></h2><div className="tools"><input aria-label="Search products" placeholder="Search products..." value={search} onChange={e => setSearch(e.target.value)} /><button onClick={load} disabled={loading}>Refresh</button></div></div>{loading ? <div className="empty" role="status">Loading your inventory...</div> : filtered.length ? <div className="table-scroll"><table><thead><tr><th>Product</th><th>Price</th><th>Quantity</th><th>Status</th><th>{isAdmin ? 'Actions' : 'Details'}</th></tr></thead><tbody>{filtered.map(p => <tr key={p.id}><td><strong>{p.product_name}</strong><div className="description">{p.description || 'No description'}</div></td><td>{money(p.price)}</td><td>{Number(p.quantity).toLocaleString()}</td><td><span className={`badge ${Number(p.quantity) === 0 ? 'out' : Number(p.quantity) < 10 ? 'low' : ''}`}>{Number(p.quantity) === 0 ? 'Out of stock' : Number(p.quantity) < 10 ? 'Low stock' : 'In stock'}</span></td><td><div className="row-actions"><button onClick={() => setDetails(p)}>View</button>{isAdmin && <><button onClick={() => openEditor(p)}>Edit</button><button className="danger-text" onClick={() => { setRemove(p); setError(''); setNotice('') }}>Delete</button></>}</div></td></tr>)}</tbody></table></div> : <div className="empty"><div className="empty-icon">▦</div><h3>{search ? 'No matching products' : 'Your catalog starts here'}</h3><p>{search ? 'Try another name or description.' : isAdmin ? 'Add your first product to start tracking your inventory.' : 'No products are available yet.'}</p>{isAdmin && !search && <button className="primary" onClick={() => openEditor(null)}>+ Add your first product</button>}</div>}<footer>{filtered.length} product{filtered.length === 1 ? '' : 's'} shown</footer></section><p className="page-footer">Stockroom · Keep things in order.</p></main>{isAdmin && editor && <div className="overlay"><section className="modal" role="dialog" aria-modal="true" aria-labelledby="editor-title"><h2 id="editor-title">{editor === 'edit' ? 'Edit product' : 'Add a product'}</h2><p>Enter the details for your inventory.</p>{alerts}<form onSubmit={save}><label>Product name<input autoFocus required maxLength={100} value={form.product_name} onChange={e => setForm({ ...form, product_name:e.target.value })} /></label><label>Description<textarea rows={3} maxLength={65535} value={form.description} onChange={e => setForm({ ...form, description:e.target.value })} /></label><div className="form-row"><label>Price (PHP)<input type="number" required min="0" max="99999999.99" step="0.01" value={form.price} onChange={e => setForm({ ...form, price:e.target.value })} /></label><label>Quantity<input type="number" required min="0" max="2147483647" step="1" value={form.quantity} onChange={e => setForm({ ...form, quantity:e.target.value })} /></label></div><div className="modal-actions"><button type="button" disabled={busy} onClick={() => setEditor(null)}>Cancel</button><button className="primary" disabled={busy}>{busy ? 'Saving...' : 'Save product'}</button></div></form></section></div>}{isAdmin && remove && <div className="overlay"><section className="modal" role="dialog" aria-modal="true" aria-labelledby="delete-title"><h2 id="delete-title">Delete product?</h2><p>“{remove.product_name}” will be permanently removed from your inventory.</p>{alerts}<div className="modal-actions"><button autoFocus disabled={busy} onClick={() => setRemove(null)}>Cancel</button><button className="danger" disabled={busy} onClick={deleteProduct}>{busy ? 'Deleting...' : 'Delete product'}</button></div></section></div>}{details && <div className="overlay"><section className="modal" role="dialog" aria-modal="true" aria-labelledby="details-title"><h2 id="details-title">{details.product_name}</h2><p>{details.description || 'No description'}</p><dl className="product-details"><dt>Product ID</dt><dd>{details.id}</dd><dt>Price</dt><dd>{money(details.price)}</dd><dt>Quantity</dt><dd>{Number(details.quantity).toLocaleString()}</dd><dt>Created</dt><dd>{details.created_at || 'Unavailable'}</dd>{isAdmin && <><dt>Inventory value</dt><dd>{money(Number(details.price)*Number(details.quantity))}</dd></>}</dl><div className="modal-actions"><button autoFocus onClick={() => setDetails(null)}>Close</button></div></section></div>}</div>
}
export default App
