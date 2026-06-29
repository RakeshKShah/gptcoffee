import { FormEvent, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowRight,
  BarChart3,
  Bean,
  Coffee,
  FileText,
  LogOut,
  Minus,
  Plus,
  RefreshCw,
  ShoppingBag,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4100/api';

type Role = 'buyer' | 'admin';

type User = {
  id: string;
  name: string;
  email: string;
  role: Role;
};

type CoffeeProduct = {
  id: string;
  name: string;
  note: string;
  description: string;
  price: number;
  strength: string;
  gradient: string;
};

type CustomOption = {
  id: string;
  label: string;
  price: number;
};

type Customizations = {
  sizes: CustomOption[];
  milks: CustomOption[];
  extras: CustomOption[];
};

type CartItem = {
  id: string;
  product: CoffeeProduct;
  size: string;
  milk: string;
  extras: string[];
  quantity: number;
  total: number;
};

type OrderItem = {
  id: string;
  productName: string;
  size: string;
  milk: string;
  extras: string[];
  quantity: number;
  total: number;
};

type Order = {
  id: string;
  buyerId: string;
  buyerName: string;
  createdAt: string;
  readyAt: string;
  status: string;
  items: OrderItem[];
  total: number;
};

type Sales = {
  daily: number;
  monthly: number;
  total: number;
  orderCount: number;
};

const emptyCustomizations: Customizations = { sizes: [], milks: [], extras: [] };

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

async function api<T>(path: string, options: RequestInit = {}, token?: string): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Request failed.' }));
    throw new Error(error.message || 'Request failed.');
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

function App() {
  const [token, setToken] = useState(() => window.localStorage.getItem('gpt-coffee-token') || '');
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const stored = window.localStorage.getItem('gpt-coffee-user');
    return stored ? (JSON.parse(stored) as User) : null;
  });
  const [products, setProducts] = useState<CoffeeProduct[]>([]);
  const [customizations, setCustomizations] = useState<Customizations>(emptyCustomizations);
  const [orders, setOrders] = useState<Order[]>([]);
  const [sales, setSales] = useState<Sales>({ daily: 0, monthly: 0, total: 0, orderCount: 0 });
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const saveSession = (nextToken: string, user: User) => {
    setToken(nextToken);
    setCurrentUser(user);
    window.localStorage.setItem('gpt-coffee-token', nextToken);
    window.localStorage.setItem('gpt-coffee-user', JSON.stringify(user));
  };

  const logout = () => {
    setToken('');
    setCurrentUser(null);
    setCartItems([]);
    setOrders([]);
    setSales({ daily: 0, monthly: 0, total: 0, orderCount: 0 });
    window.localStorage.removeItem('gpt-coffee-token');
    window.localStorage.removeItem('gpt-coffee-user');
  };

  const loadMenu = async () => {
    const data = await api<{ products: CoffeeProduct[]; customizations: Customizations }>('/menu');
    setProducts(data.products);
    setCustomizations(data.customizations);
  };

  const loadOrders = async () => {
    if (!currentUser || !token) return;
    if (currentUser.role === 'admin') {
      const [orderData, salesData] = await Promise.all([
        api<{ orders: Order[] }>('/admin/orders', {}, token),
        api<Sales>('/admin/sales', {}, token),
      ]);
      setOrders(orderData.orders);
      setSales(salesData);
      return;
    }

    const data = await api<{ orders: Order[] }>('/orders/my', {}, token);
    setOrders(data.orders);
  };

  const refresh = async () => {
    try {
      setError('');
      await loadMenu();
      await loadOrders();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Could not connect to the server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
  }, [currentUser?.id, token]);

  const login = async (email: string, password: string) => {
    const data = await api<{ token: string; user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    saveSession(data.token, data.user);
  };

  const signup = async (name: string, email: string, password: string) => {
    const data = await api<{ token: string; user: User }>('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    });
    saveSession(data.token, data.user);
  };

  const checkout = async (items: CartItem[]) => {
    const orderItems: OrderItem[] = items.map((item) => ({
      id: item.id,
      productName: item.product.name,
      size: item.size,
      milk: item.milk,
      extras: item.extras,
      quantity: item.quantity,
      total: item.total,
    }));
    await api<{ order: Order }>('/orders', { method: 'POST', body: JSON.stringify({ items: orderItems }) }, token);
    setCartItems([]);
    await loadOrders();
  };

  const saveProduct = async (product: CoffeeProduct) => {
    if (products.some((item) => item.id === product.id)) {
      const data = await api<{ product: CoffeeProduct }>(
        `/admin/products/${product.id}`,
        { method: 'PATCH', body: JSON.stringify(product) },
        token,
      );
      setProducts((current) => current.map((item) => (item.id === product.id ? data.product : item)));
      return;
    }

    const data = await api<{ product: CoffeeProduct }>(
      '/admin/products',
      { method: 'POST', body: JSON.stringify(product) },
      token,
    );
    setProducts((current) => [data.product, ...current]);
  };

  const removeProduct = async (id: string) => {
    await api(`/admin/products/${id}`, { method: 'DELETE' }, token);
    setProducts((current) => current.filter((product) => product.id !== id));
  };

  const saveCustomizations = async (nextCustomizations: Customizations) => {
    const data = await api<{ customizations: Customizations }>(
      '/admin/customizations',
      { method: 'PUT', body: JSON.stringify({ customizations: nextCustomizations }) },
      token,
    );
    setCustomizations(data.customizations);
  };

  const updateOrderStatus = async (id: string, status: string) => {
    const data = await api<{ order: Order }>(
      `/admin/orders/${id}/status`,
      { method: 'PATCH', body: JSON.stringify({ status }) },
      token,
    );
    setOrders((current) => current.map((order) => (order.id === id ? data.order : order)));
    const nextSales = await api<Sales>('/admin/sales', {}, token);
    setSales(nextSales);
  };

  if (!currentUser) {
    return <AuthScreen onLogin={login} onSignup={signup} serverError={error} />;
  }

  if (loading) {
    return <LoadingScreen />;
  }

  if (currentUser.role === 'admin') {
    return (
      <AdminDashboard
        user={currentUser}
        products={products}
        customizations={customizations}
        orders={orders}
        sales={sales}
        error={error}
        onRefresh={refresh}
        onLogout={logout}
        onSaveProduct={saveProduct}
        onRemoveProduct={removeProduct}
        onSaveCustomizations={saveCustomizations}
        onUpdateOrderStatus={updateOrderStatus}
      />
    );
  }

  return (
    <BuyerApp
      user={currentUser}
      products={products}
      customizations={customizations}
      orders={orders}
      cartItems={cartItems}
      setCartItems={setCartItems}
      onCheckout={checkout}
      onRefresh={refresh}
      onLogout={logout}
      error={error}
    />
  );
}

function AuthScreen({
  onLogin,
  onSignup,
  serverError,
}: {
  onLogin: (email: string, password: string) => Promise<void>;
  onSignup: (name: string, email: string, password: string) => Promise<void>;
  serverError: string;
}) {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('buyer@gptcoffee.test');
  const [password, setPassword] = useState('buyer123');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setMessage('');
    try {
      if (mode === 'login') {
        await onLogin(email.trim(), password);
      } else {
        await onSignup(name.trim() || 'Coffee Guest', email.trim(), password);
      }
    } catch (requestError) {
      setMessage(requestError instanceof Error ? requestError.message : 'Authentication failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const useDemo = (role: Role) => {
    setMode('login');
    setName(role === 'buyer' ? 'Maya Buyer' : 'Ari Admin');
    setEmail(role === 'buyer' ? 'buyer@gptcoffee.test' : 'admin@gptcoffee.test');
    setPassword(role === 'buyer' ? 'buyer123' : 'admin123');
    setMessage('');
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#120b08] px-5 py-8 text-stone-100">
      <AmbientGlow />
      <div className="relative mx-auto grid min-h-[calc(100vh-4rem)] w-full max-w-6xl items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]">
        <motion.section initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}>
          <BrandTitle subtitle="Full stack ordering" title="GPT Coffee" />
          <h2 className="mt-10 max-w-2xl text-5xl font-semibold tracking-[-0.05em] text-white sm:text-7xl">
            Order from home. Pick up when your cup is ready.
          </h2>
          <p className="mt-6 max-w-xl text-lg leading-8 text-stone-300">
            Customers check out remotely while admins view orders, sales, and menu controls from any browser connected
            to the backend API.
          </p>
          <div className="mt-8 grid max-w-2xl gap-3 sm:grid-cols-2">
            <CredentialCard title="Sample buyer" email="buyer@gptcoffee.test" password="buyer123" onUse={() => useDemo('buyer')} />
            <CredentialCard title="Sample admin" email="admin@gptcoffee.test" password="admin123" onUse={() => useDemo('admin')} />
          </div>
          {serverError && (
            <p className="mt-6 rounded-2xl border border-red-300/20 bg-red-500/10 px-4 py-3 text-sm text-red-100">
              API status: {serverError}. Start `GPTCoffeeServer` with `npm run dev`.
            </p>
          )}
        </motion.section>

        <motion.form
          onSubmit={submit}
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-[2rem] border border-white/10 bg-white/[0.07] p-6 shadow-2xl shadow-black/40 backdrop-blur-xl sm:p-8"
        >
          <div className="mb-6 flex rounded-full bg-black/20 p-1">
            {(['login', 'signup'] as const).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => {
                  setMode(option);
                  setMessage('');
                }}
                className={`flex-1 rounded-full px-4 py-3 text-sm font-semibold capitalize transition ${
                  mode === option ? 'bg-amber-200 text-stone-950' : 'text-stone-400 hover:text-white'
                }`}
              >
                {option}
              </button>
            ))}
          </div>

          {mode === 'signup' && <Field label="Name" value={name} onChange={setName} placeholder="Your name" />}
          <Field label="Email" value={email} onChange={setEmail} placeholder="you@example.com" type="email" />
          <Field label="Password" value={password} onChange={setPassword} placeholder="••••••••" type="password" />
          {message && <p className="mt-4 rounded-2xl bg-red-500/10 px-4 py-3 text-sm text-red-200">{message}</p>}

          <button
            disabled={submitting}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-amber-200 px-5 py-4 font-semibold text-stone-950 transition hover:bg-amber-100 disabled:opacity-60"
          >
            {submitting ? 'Working...' : mode === 'login' ? 'Login' : 'Create buyer account'}
            <ArrowRight className="h-5 w-5" />
          </button>
        </motion.form>
      </div>
    </main>
  );
}

function BuyerApp({
  user,
  products,
  customizations,
  orders,
  cartItems,
  setCartItems,
  onCheckout,
  onRefresh,
  onLogout,
  error,
}: {
  user: User;
  products: CoffeeProduct[];
  customizations: Customizations;
  orders: Order[];
  cartItems: CartItem[];
  setCartItems: (items: CartItem[] | ((items: CartItem[]) => CartItem[])) => void;
  onCheckout: (items: CartItem[]) => Promise<void>;
  onRefresh: () => Promise<void>;
  onLogout: () => void;
  error: string;
}) {
  const [selectedProduct, setSelectedProduct] = useState<CoffeeProduct | null>(null);
  const [checkoutMessage, setCheckoutMessage] = useState('');
  const [checkingOut, setCheckingOut] = useState(false);

  const checkout = async () => {
    if (!cartItems.length) return;
    setCheckingOut(true);
    setCheckoutMessage('');
    await onCheckout(cartItems);
    setCheckoutMessage('Order placed. Watch your pickup status below.');
    setCheckingOut(false);
  };

  return (
    <main className="relative h-screen overflow-y-auto bg-[#120b08] text-stone-100">
      <AmbientGlow />
      <div className="relative mx-auto flex min-h-screen w-full max-w-7xl flex-col px-5 py-6 sm:px-8 lg:px-10">
        <AppHeader user={user} onRefresh={onRefresh} onLogout={onLogout} />
        <Hero />
        <StatusMessage message={error || checkoutMessage} kind={error ? 'error' : 'success'} />

        <section className="grid gap-6 pb-10 xl:grid-cols-[1fr_380px]">
          <div>
            <SectionHeading eyebrow="Menu" title="Signature drinks" description="Customize every cup and check out for pickup." />
            <div className="grid gap-5 md:grid-cols-2">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} onCustomize={setSelectedProduct} />
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <Cart
              items={cartItems}
              onRemove={(id) => setCartItems((items) => items.filter((item) => item.id !== id))}
              onCheckout={checkout}
              checkingOut={checkingOut}
            />
            <CustomerOrders orders={orders} />
          </div>
        </section>
      </div>

      <AnimatePresence>
        {selectedProduct && (
          <>
            <motion.button
              aria-label="Close customization overlay"
              className="fixed inset-0 z-30 cursor-default bg-black/60 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedProduct(null)}
            />
            <CustomizationPanel
              product={selectedProduct}
              customizations={customizations}
              onClose={() => setSelectedProduct(null)}
              onAdd={(item) => setCartItems((items) => [item, ...items])}
            />
          </>
        )}
      </AnimatePresence>
    </main>
  );
}

function AdminDashboard({
  user,
  products,
  customizations,
  orders,
  sales,
  error,
  onRefresh,
  onLogout,
  onSaveProduct,
  onRemoveProduct,
  onSaveCustomizations,
  onUpdateOrderStatus,
}: {
  user: User;
  products: CoffeeProduct[];
  customizations: Customizations;
  orders: Order[];
  sales: Sales;
  error: string;
  onRefresh: () => Promise<void>;
  onLogout: () => void;
  onSaveProduct: (product: CoffeeProduct) => Promise<void>;
  onRemoveProduct: (id: string) => Promise<void>;
  onSaveCustomizations: (customizations: Customizations) => Promise<void>;
  onUpdateOrderStatus: (id: string, status: string) => Promise<void>;
}) {
  return (
    <main className="relative min-h-screen overflow-y-auto bg-[#120b08] text-stone-100">
      <AmbientGlow />
      <div className="relative mx-auto w-full max-w-7xl px-5 py-6 sm:px-8 lg:px-10">
        <AppHeader user={user} onRefresh={onRefresh} onLogout={onLogout} />
        <section className="py-10">
          <p className="text-sm uppercase tracking-[0.3em] text-amber-200/70">Admin Dashboard</p>
          <h2 className="mt-3 text-5xl font-semibold tracking-[-0.04em] text-white">Manage orders from anywhere.</h2>
          <p className="mt-4 max-w-2xl text-stone-300">
            This dashboard reads from the backend API, so a deployed admin can monitor orders and sales remotely.
          </p>
        </section>

        <StatusMessage message={error} kind="error" />

        <div className="grid gap-4 md:grid-cols-4">
          <MetricCard icon={<ShoppingBag />} label="Orders" value={String(sales.orderCount)} />
          <MetricCard icon={<BarChart3 />} label="Daily sales" value={formatCurrency(sales.daily)} />
          <MetricCard icon={<FileText />} label="Monthly sales" value={formatCurrency(sales.monthly)} />
          <MetricCard icon={<Sparkles />} label="All-time sales" value={formatCurrency(sales.total)} />
        </div>

        <div className="mt-8 grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
          <MenuManager products={products} onSaveProduct={onSaveProduct} onRemoveProduct={onRemoveProduct} />
          <CustomizationManager customizations={customizations} onSaveCustomizations={onSaveCustomizations} />
        </div>

        <OrderHistory orders={orders} onUpdateOrderStatus={onUpdateOrderStatus} />
      </div>
    </main>
  );
}

function ProductCard({
  product,
  onCustomize,
}: {
  product: CoffeeProduct;
  onCustomize: (product: CoffeeProduct) => void;
}) {
  return (
    <motion.article
      layout
      whileHover={{ y: -8, scale: 1.01 }}
      transition={{ type: 'spring', stiffness: 260, damping: 24 }}
      className="group relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.06] p-5 shadow-2xl shadow-black/30 backdrop-blur"
    >
      <div className={`absolute inset-x-0 top-0 h-28 bg-gradient-to-br ${product.gradient} opacity-70 blur-2xl`} />
      <div className="relative">
        <div className="flex items-start justify-between gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-stone-950/70 ring-1 ring-white/15">
            <Coffee className="h-8 w-8 text-amber-200" />
          </div>
          <span className="rounded-full border border-amber-300/20 bg-amber-200/10 px-3 py-1 text-xs font-medium text-amber-100">
            {product.strength}
          </span>
        </div>

        <div className="mt-8">
          <p className="text-sm text-amber-200/80">{product.note}</p>
          <h3 className="mt-2 text-2xl font-semibold tracking-tight text-white">{product.name}</h3>
          <p className="mt-3 min-h-20 text-sm leading-6 text-stone-300">{product.description}</p>
        </div>

        <div className="mt-6 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-stone-500">From</p>
            <p className="text-2xl font-semibold text-amber-100">{formatCurrency(product.price)}</p>
          </div>
          <button
            onClick={() => onCustomize(product)}
            className="rounded-full bg-amber-200 px-5 py-3 text-sm font-semibold text-stone-950 shadow-lg shadow-amber-950/30 transition hover:bg-amber-100"
          >
            Customize
          </button>
        </div>
      </div>
    </motion.article>
  );
}

function CustomizationPanel({
  product,
  customizations,
  onClose,
  onAdd,
}: {
  product: CoffeeProduct;
  customizations: Customizations;
  onClose: () => void;
  onAdd: (item: CartItem) => void;
}) {
  const [size, setSize] = useState(customizations.sizes[1] ?? customizations.sizes[0]);
  const [milk, setMilk] = useState(customizations.milks[0]);
  const [selectedExtras, setSelectedExtras] = useState<string[]>([]);
  const [quantity, setQuantity] = useState(1);

  const total = useMemo(() => {
    const extrasTotal = customizations.extras
      .filter((extra) => selectedExtras.includes(extra.label))
      .reduce((sum, extra) => sum + extra.price, 0);
    return (product.price + (size?.price ?? 0) + (milk?.price ?? 0) + extrasTotal) * quantity;
  }, [customizations.extras, milk?.price, product.price, quantity, selectedExtras, size?.price]);

  const toggleExtra = (label: string) => {
    setSelectedExtras((current) =>
      current.includes(label) ? current.filter((item) => item !== label) : [...current, label],
    );
  };

  const addToCart = () => {
    onAdd({
      id: `${product.id}-${Date.now()}`,
      product,
      size: size?.label ?? 'Standard',
      milk: milk?.label ?? 'None',
      extras: selectedExtras,
      quantity,
      total,
    });
    onClose();
  };

  return (
    <motion.aside
      initial={{ opacity: 0, x: 80 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 80 }}
      transition={{ type: 'spring', stiffness: 220, damping: 26 }}
      className="fixed inset-y-0 right-0 z-40 flex w-full max-w-xl flex-col overflow-y-auto border-l border-white/10 bg-[#17100c]/95 p-6 shadow-2xl shadow-black/60 backdrop-blur-xl sm:p-8"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.32em] text-amber-200/70">Customize</p>
          <h2 className="mt-2 text-3xl font-semibold text-white">{product.name}</h2>
        </div>
        <button
          onClick={onClose}
          className="rounded-full border border-white/10 p-3 text-stone-300 transition hover:bg-white/10 hover:text-white"
          aria-label="Close customization"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <section className="mt-8 space-y-5">
        <OptionGroup title="Cup Size" options={customizations.sizes} selected={size?.label} onSelect={setSize} />
        <OptionGroup title="Milk" options={customizations.milks} selected={milk?.label} onSelect={setMilk} />
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-[0.22em] text-stone-400">Finishing Touches</h3>
          <div className="mt-3 grid grid-cols-2 gap-3">
            {customizations.extras.map((extra) => {
              const active = selectedExtras.includes(extra.label);
              return (
                <button
                  key={extra.id}
                  onClick={() => toggleExtra(extra.label)}
                  className={`rounded-2xl border p-4 text-left transition ${
                    active
                      ? 'border-amber-200 bg-amber-200 text-stone-950'
                      : 'border-white/10 bg-white/[0.04] text-stone-200 hover:border-amber-200/50'
                  }`}
                >
                  <span className="block text-sm font-semibold">{extra.label}</span>
                  <span className={`mt-1 block text-xs ${active ? 'text-stone-700' : 'text-stone-500'}`}>
                    +{formatCurrency(extra.price)}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <div className="mt-auto pt-8">
        <div className="flex items-center justify-between rounded-3xl border border-white/10 bg-black/20 p-3">
          <button
            onClick={() => setQuantity((value) => Math.max(1, value - 1))}
            className="rounded-2xl bg-white/10 p-3 text-white transition hover:bg-white/15"
            aria-label="Decrease quantity"
          >
            <Minus className="h-5 w-5" />
          </button>
          <span className="text-lg font-semibold text-white">{quantity}</span>
          <button
            onClick={() => setQuantity((value) => value + 1)}
            className="rounded-2xl bg-white/10 p-3 text-white transition hover:bg-white/15"
            aria-label="Increase quantity"
          >
            <Plus className="h-5 w-5" />
          </button>
        </div>
        <button
          onClick={addToCart}
          className="mt-4 flex w-full items-center justify-between rounded-full bg-amber-200 px-6 py-4 text-base font-semibold text-stone-950 shadow-xl shadow-amber-950/30 transition hover:bg-amber-100"
        >
          Add to cart
          <span>{formatCurrency(total)}</span>
        </button>
      </div>
    </motion.aside>
  );
}

function OptionGroup({
  title,
  options,
  selected,
  onSelect,
}: {
  title: string;
  options: CustomOption[];
  selected?: string;
  onSelect: (option: CustomOption) => void;
}) {
  return (
    <div>
      <h3 className="text-sm font-semibold uppercase tracking-[0.22em] text-stone-400">{title}</h3>
      <div className="mt-3 grid grid-cols-3 gap-3">
        {options.map((option) => {
          const active = selected === option.label;
          return (
            <button
              key={option.id}
              onClick={() => onSelect(option)}
              className={`rounded-2xl border p-4 text-left transition ${
                active
                  ? 'border-amber-200 bg-amber-200 text-stone-950'
                  : 'border-white/10 bg-white/[0.04] text-stone-200 hover:border-amber-200/50'
              }`}
            >
              <span className="block text-sm font-semibold">{option.label}</span>
              <span className={`mt-1 block text-xs ${active ? 'text-stone-700' : 'text-stone-500'}`}>
                {option.price === 0 ? 'Included' : `+${formatCurrency(option.price)}`}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function Cart({
  items,
  onRemove,
  onCheckout,
  checkingOut,
}: {
  items: CartItem[];
  onRemove: (id: string) => void;
  onCheckout: () => void;
  checkingOut: boolean;
}) {
  const subtotal = items.reduce((sum, item) => sum + item.total, 0);

  return (
    <motion.section
      layout
      className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-5 shadow-2xl shadow-black/30 backdrop-blur xl:sticky xl:top-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-amber-200/70">Your Cart</p>
          <h2 className="mt-2 text-2xl font-semibold text-white">{items.length ? 'Pickup order' : 'Start an order'}</h2>
        </div>
        <motion.div
          key={items.length}
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          className="relative rounded-2xl bg-amber-200 p-3 text-stone-950"
        >
          <ShoppingBag className="h-6 w-6" />
          {items.length > 0 && (
            <span className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-white text-xs font-bold">
              {items.length}
            </span>
          )}
        </motion.div>
      </div>

      <div className="mt-6 min-h-40 space-y-3">
        <AnimatePresence initial={false}>
          {items.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="rounded-3xl border border-dashed border-white/15 p-6 text-center text-stone-400"
            >
              Pick a drink and customize it to see your order here.
            </motion.div>
          ) : (
            items.map((item) => (
              <motion.div
                layout
                key={item.id}
                initial={{ opacity: 0, y: 16, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, x: 40, scale: 0.96 }}
                className="rounded-3xl border border-white/10 bg-black/20 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-white">{item.product.name}</p>
                    <p className="mt-1 text-xs leading-5 text-stone-400">
                      {item.quantity} x {item.size}, {item.milk}
                      {item.extras.length ? `, ${item.extras.join(', ')}` : ''}
                    </p>
                  </div>
                  <button
                    onClick={() => onRemove(item.id)}
                    className="rounded-full p-2 text-stone-500 transition hover:bg-white/10 hover:text-white"
                    aria-label={`Remove ${item.product.name}`}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <p className="mt-3 text-right font-semibold text-amber-100">{formatCurrency(item.total)}</p>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>

      <div className="mt-6 border-t border-white/10 pt-5">
        <div className="flex items-center justify-between text-stone-300">
          <span>Subtotal</span>
          <span>{formatCurrency(subtotal)}</span>
        </div>
        <p className="mt-2 text-sm text-stone-500">Estimated pickup: about 15 minutes after checkout.</p>
        <button
          disabled={items.length === 0 || checkingOut}
          onClick={onCheckout}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-white px-5 py-4 font-semibold text-stone-950 transition enabled:hover:bg-amber-100 disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-stone-500"
        >
          {checkingOut ? 'Sending order...' : 'Checkout for pickup'}
          <ArrowRight className="h-5 w-5" />
        </button>
      </div>
    </motion.section>
  );
}

function CustomerOrders({ orders }: { orders: Order[] }) {
  return (
    <section className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-5 shadow-2xl shadow-black/30 backdrop-blur">
      <h2 className="text-2xl font-semibold text-white">Your pickup status</h2>
      <div className="mt-5 space-y-3">
        {orders.length === 0 ? (
          <p className="rounded-3xl border border-dashed border-white/15 p-5 text-sm text-stone-400">
            Your placed orders will appear here.
          </p>
        ) : (
          orders.slice(0, 4).map((order) => (
            <div key={order.id} className="rounded-3xl border border-white/10 bg-black/20 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-white">{order.id}</p>
                  <p className="mt-1 text-xs text-stone-400">
                    Ready around {new Date(order.readyAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                  </p>
                </div>
                <span className="rounded-full bg-amber-200/10 px-3 py-1 text-xs font-semibold text-amber-100">
                  {order.status}
                </span>
              </div>
              <p className="mt-3 text-sm text-stone-300">
                {order.items.map((item) => `${item.quantity}x ${item.productName}`).join(', ')}
              </p>
              <p className="mt-2 text-right font-semibold text-amber-100">{formatCurrency(order.total)}</p>
            </div>
          ))
        )}
      </div>
    </section>
  );
}

function MenuManager({
  products,
  onSaveProduct,
  onRemoveProduct,
}: {
  products: CoffeeProduct[];
  onSaveProduct: (product: CoffeeProduct) => Promise<void>;
  onRemoveProduct: (id: string) => Promise<void>;
}) {
  const emptyProduct: CoffeeProduct = {
    id: '',
    name: '',
    note: '',
    description: '',
    price: 6,
    strength: 'Balanced',
    gradient: 'from-amber-300 via-orange-500 to-stone-900',
  };
  const [draft, setDraft] = useState<CoffeeProduct>(emptyProduct);
  const [saving, setSaving] = useState(false);

  const save = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    await onSaveProduct({
      ...draft,
      id: draft.id || slugify(draft.name) || `coffee-${Date.now()}`,
      price: Number(draft.price),
    });
    setDraft(emptyProduct);
    setSaving(false);
  };

  return (
    <section className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-5 shadow-2xl shadow-black/20">
      <h3 className="text-2xl font-semibold text-white">Coffee flavors</h3>
      <form onSubmit={save} className="mt-4 grid gap-3 sm:grid-cols-2">
        <AdminInput label="Name" value={draft.name} onChange={(name) => setDraft((item) => ({ ...item, name }))} required />
        <AdminInput
          label="Price"
          type="number"
          value={String(draft.price)}
          onChange={(price) => setDraft((item) => ({ ...item, price: Number(price) }))}
        />
        <AdminInput label="Tasting note" value={draft.note} onChange={(note) => setDraft((item) => ({ ...item, note }))} />
        <AdminInput label="Strength" value={draft.strength} onChange={(strength) => setDraft((item) => ({ ...item, strength }))} />
        <label className="sm:col-span-2">
          <span className="text-sm font-semibold text-stone-300">Description</span>
          <textarea
            value={draft.description}
            onChange={(event) => setDraft((item) => ({ ...item, description: event.target.value }))}
            className="mt-2 min-h-24 w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-white outline-none focus:border-amber-200/70"
          />
        </label>
        <button
          disabled={saving}
          className="rounded-full bg-amber-200 px-5 py-3 font-semibold text-stone-950 hover:bg-amber-100 disabled:opacity-60"
        >
          {saving ? 'Saving...' : draft.id ? 'Save flavor' : 'Add flavor'}
        </button>
      </form>

      <div className="mt-5 space-y-3">
        {products.map((product) => (
          <div key={product.id} className="flex items-center justify-between gap-3 rounded-3xl border border-white/10 bg-black/20 p-4">
            <div>
              <p className="font-semibold text-white">{product.name}</p>
              <p className="text-sm text-stone-400">
                {formatCurrency(product.price)} · {product.strength}
              </p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setDraft(product)} className="rounded-full bg-white/10 px-4 py-2 text-sm text-white hover:bg-white/15">
                Edit
              </button>
              <button
                onClick={() => void onRemoveProduct(product.id)}
                className="rounded-full bg-red-400/10 px-4 py-2 text-sm text-red-200 hover:bg-red-400/20"
              >
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function CustomizationManager({
  customizations,
  onSaveCustomizations,
}: {
  customizations: Customizations;
  onSaveCustomizations: (customizations: Customizations) => Promise<void>;
}) {
  const [draft, setDraft] = useState(customizations);
  const [saving, setSaving] = useState(false);

  useEffect(() => setDraft(customizations), [customizations]);

  const save = async () => {
    setSaving(true);
    await onSaveCustomizations(draft);
    setSaving(false);
  };

  return (
    <section className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-5 shadow-2xl shadow-black/20">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-2xl font-semibold text-white">Customization options</h3>
        <button
          onClick={save}
          disabled={saving}
          className="rounded-full bg-amber-200 px-4 py-2 text-sm font-semibold text-stone-950 hover:bg-amber-100 disabled:opacity-60"
        >
          {saving ? 'Saving...' : 'Save all'}
        </button>
      </div>
      <div className="mt-5 space-y-5">
        {(['sizes', 'milks', 'extras'] as const).map((group) => (
          <OptionManager
            key={group}
            title={group}
            options={draft[group]}
            setOptions={(options) => setDraft((current) => ({ ...current, [group]: options }))}
          />
        ))}
      </div>
    </section>
  );
}

function OptionManager({
  title,
  options,
  setOptions,
}: {
  title: string;
  options: CustomOption[];
  setOptions: (options: CustomOption[]) => void;
}) {
  const [label, setLabel] = useState('');
  const [price, setPrice] = useState('0');

  const addOption = () => {
    if (!label.trim()) return;
    setOptions([{ id: slugify(label) || `option-${Date.now()}`, label: label.trim(), price: Number(price) }, ...options]);
    setLabel('');
    setPrice('0');
  };

  return (
    <div>
      <p className="mb-3 text-sm font-semibold uppercase tracking-[0.24em] text-amber-200/70">{title}</p>
      <div className="grid gap-2 sm:grid-cols-[1fr_100px_auto]">
        <input
          value={label}
          onChange={(event) => setLabel(event.target.value)}
          placeholder={`New ${title}`}
          className="rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-white outline-none focus:border-amber-200/70"
        />
        <input
          value={price}
          onChange={(event) => setPrice(event.target.value)}
          type="number"
          step="0.05"
          className="rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-white outline-none focus:border-amber-200/70"
        />
        <button onClick={addOption} className="rounded-2xl bg-amber-200 px-4 py-3 font-semibold text-stone-950">
          Add
        </button>
      </div>
      <div className="mt-3 space-y-2">
        {options.map((option) => (
          <div key={option.id} className="flex items-center justify-between rounded-2xl bg-black/20 px-4 py-3">
            <span className="text-sm text-white">
              {option.label} · {formatCurrency(option.price)}
            </span>
            <button onClick={() => setOptions(options.filter((item) => item.id !== option.id))} className="text-red-200 hover:text-red-100">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function OrderHistory({
  orders,
  onUpdateOrderStatus,
}: {
  orders: Order[];
  onUpdateOrderStatus: (id: string, status: string) => Promise<void>;
}) {
  const statuses = ['Placed', 'Preparing', 'Ready for pickup', 'Completed'];

  return (
    <section className="mt-8 rounded-[2rem] border border-white/10 bg-white/[0.06] p-5 shadow-2xl shadow-black/20">
      <h3 className="text-2xl font-semibold text-white">Live order history</h3>
      <div className="mt-5 overflow-x-auto">
        <table className="w-full min-w-[840px] text-left text-sm">
          <thead className="text-stone-400">
            <tr>
              <th className="py-3">Order</th>
              <th>Buyer</th>
              <th>Pickup</th>
              <th>Items</th>
              <th>Status</th>
              <th className="text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id} className="border-t border-white/10 text-stone-200">
                <td className="py-4 font-semibold text-white">{order.id}</td>
                <td>{order.buyerName}</td>
                <td>{new Date(order.readyAt).toLocaleString()}</td>
                <td>{order.items.map((item) => `${item.quantity}x ${item.productName}`).join(', ')}</td>
                <td>
                  <select
                    value={order.status}
                    onChange={(event) => void onUpdateOrderStatus(order.id, event.target.value)}
                    className="rounded-xl border border-white/10 bg-stone-950 px-3 py-2 text-white"
                  >
                    {statuses.map((status) => (
                      <option key={status}>{status}</option>
                    ))}
                  </select>
                </td>
                <td className="text-right font-semibold text-amber-100">{formatCurrency(order.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function AppHeader({
  user,
  onRefresh,
  onLogout,
}: {
  user: User;
  onRefresh: () => Promise<void>;
  onLogout: () => void;
}) {
  return (
    <header className="flex items-center justify-between gap-4">
      <BrandTitle subtitle="GPT Coffee" title={`Welcome, ${user.name}`} />
      <div className="flex gap-2">
        <button
          onClick={() => void onRefresh()}
          className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-4 py-2 text-sm text-stone-300 transition hover:bg-white/10 hover:text-white"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
        <button
          onClick={onLogout}
          className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-4 py-2 text-sm text-stone-300 transition hover:bg-white/10 hover:text-white"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="grid gap-10 py-12 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
      <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
        <span className="inline-flex rounded-full border border-amber-200/20 bg-amber-200/10 px-4 py-2 text-sm font-medium text-amber-100">
          Warm dark cafe experience
        </span>
        <h2 className="mt-6 max-w-3xl text-5xl font-semibold tracking-[-0.05em] text-white sm:text-7xl">
          Order ahead and pick up fresh.
        </h2>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-stone-300">
          Customize from home, check out online, then pick up once the barista marks your order ready.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.92, rotate: -2 }}
        animate={{ opacity: 1, scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 120, damping: 16 }}
        className="relative mx-auto aspect-square w-full max-w-md rounded-[3rem] border border-white/10 bg-gradient-to-br from-amber-200 via-orange-700 to-stone-950 p-1 shadow-2xl shadow-black/40"
      >
        <div className="flex h-full flex-col justify-between rounded-[2.8rem] bg-stone-950/75 p-8">
          <div className="flex items-center justify-between">
            <span className="rounded-full bg-white/10 px-4 py-2 text-sm text-amber-100">Pickup in 15 min</span>
            <Coffee className="h-10 w-10 text-amber-100" />
          </div>
          <div>
            <p className="text-sm uppercase tracking-[0.34em] text-amber-200/70">Remote ordering</p>
            <h3 className="mt-3 text-4xl font-semibold text-white">Ready when you arrive</h3>
            <p className="mt-4 text-stone-300">Orders sync through the backend for customers and admins.</p>
          </div>
        </div>
      </motion.div>
    </section>
  );
}

function BrandTitle({ subtitle, title }: { subtitle: string; title: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-200 text-stone-950 shadow-lg shadow-amber-950/30">
        <Bean className="h-6 w-6" />
      </div>
      <div>
        <p className="text-xs uppercase tracking-[0.34em] text-amber-200/70">{subtitle}</p>
        <h1 className="text-xl font-semibold text-white">{title}</h1>
      </div>
    </div>
  );
}

function CredentialCard({
  title,
  email,
  password,
  onUse,
}: {
  title: string;
  email: string;
  password: string;
  onUse: () => void;
}) {
  return (
    <button
      onClick={onUse}
      className="rounded-3xl border border-white/10 bg-white/[0.05] p-4 text-left transition hover:border-amber-200/50 hover:bg-white/[0.08]"
    >
      <p className="font-semibold text-white">{title}</p>
      <p className="mt-2 text-sm text-stone-400">{email}</p>
      <p className="text-sm text-amber-100">{password}</p>
    </button>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <label className="mt-4 block">
      <span className="text-sm font-semibold text-stone-300">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        type={type}
        className="mt-2 w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-white outline-none transition placeholder:text-stone-600 focus:border-amber-200/70"
      />
    </label>
  );
}

function AdminInput({
  label,
  value,
  onChange,
  type = 'text',
  required,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <label>
      <span className="text-sm font-semibold text-stone-300">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        type={type}
        step={type === 'number' ? '0.05' : undefined}
        required={required}
        className="mt-2 w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-white outline-none focus:border-amber-200/70"
      />
    </label>
  );
}

function SectionHeading({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return (
    <div className="mb-5 flex items-end justify-between gap-4">
      <div>
        <p className="text-sm uppercase tracking-[0.3em] text-amber-200/70">{eyebrow}</p>
        <h2 className="mt-2 text-3xl font-semibold text-white">{title}</h2>
      </div>
      <p className="hidden max-w-sm text-right text-sm text-stone-400 sm:block">{description}</p>
    </div>
  );
}

function MetricCard({ icon, label, value }: { icon: JSX.Element; label: string; value: string }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-5 shadow-xl shadow-black/20">
      <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-200 text-stone-950">
        {icon}
      </div>
      <p className="text-sm text-stone-400">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-white">{value}</p>
    </div>
  );
}

function StatusMessage({ message, kind }: { message: string; kind: 'error' | 'success' }) {
  if (!message) return null;
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`mb-6 rounded-3xl border px-5 py-4 ${
        kind === 'error'
          ? 'border-red-300/20 bg-red-500/10 text-red-100'
          : 'border-emerald-300/20 bg-emerald-300/10 text-emerald-100'
      }`}
    >
      {message}
    </motion.div>
  );
}

function LoadingScreen() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#120b08] text-stone-100">
      <div className="text-center">
        <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-amber-200 border-t-transparent" />
        <p className="text-stone-300">Connecting to GPT Coffee API...</p>
      </div>
    </main>
  );
}

function AmbientGlow() {
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden">
      <div className="absolute -left-24 top-0 h-80 w-80 rounded-full bg-amber-500/20 blur-3xl" />
      <div className="absolute right-0 top-20 h-96 w-96 rounded-full bg-orange-900/30 blur-3xl" />
      <div className="absolute bottom-0 left-1/3 h-80 w-80 rounded-full bg-yellow-700/10 blur-3xl" />
    </div>
  );
}

export default App;
