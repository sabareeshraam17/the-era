
const PRODUCTS=[{"id": "baggy-combo", "name": "Baggy Combo", "price": 1480, "image": "assets/combo.jpg", "tag": "BESTSELLER", "category": "Sets", "color": "Midnight Black", "sizes": ["S", "M", "L", "XL"]}, {"id": "baggy-black-denim", "name": "Baggy Black Light Washed Denim", "price": 899, "image": "assets/denim.jpg", "tag": "NEW", "category": "Denim", "color": "Washed Black", "sizes": ["S", "M", "L", "XL"]}, {"id": "slim-yellow-stripe-shirt", "name": "Slim Fit Yellow Stripe Shirt", "price": 599, "image": "assets/shirt.jpg", "tag": "ESSENTIAL", "category": "Shirts", "color": "Butter Yellow", "sizes": ["S", "M", "L", "XL"]}, {"id": "relaxed-oxford-shirt", "name": "Relaxed Oxford Shirt", "price": 699, "image": "assets/relaxed-oxford-shirt.jpg", "tag": "SMART CASUAL", "category": "Shirts", "color": "Sky Blue Stripe", "sizes": ["S", "M", "L", "XL"]}, {"id": "knit-polo", "name": "Textured Knit Polo", "price": 749, "image": "assets/knit-polo.jpg", "tag": "ELEVATED", "category": "Casual", "color": "Black", "sizes": ["S", "M", "L", "XL"]}, {"id": "pleated-trousers", "name": "Wide-Leg Pleated Trousers", "price": 999, "image": "assets/pleated-trousers.jpg", "tag": "TAILORED", "category": "Bottoms", "color": "Chocolate Brown", "sizes": ["S", "M", "L", "XL"]}, {"id": "boxy-tee", "name": "Heavyweight Boxy Tee", "price": 499, "image": "assets/boxy-tee.jpg", "tag": "EVERYDAY", "category": "Streetwear", "color": "Black", "sizes": ["S", "M", "L", "XL"]}, {"id": "utility-overshirt", "name": "Utility Overshirt", "price": 899, "image": "assets/utility-overshirt.jpg", "tag": "LAYERING", "category": "Streetwear", "color": "Earth Brown", "sizes": ["S", "M", "L", "XL"]}];
const CART_KEY="theEraCart",ORDER_KEY="theEraLastOrder";
function getCart(){try{return JSON.parse(localStorage.getItem(CART_KEY))||[]}catch{return[]}}
function saveCart(c){localStorage.setItem(CART_KEY,JSON.stringify(c));updateCartCount()}
function money(n){return "₹"+Number(n).toLocaleString("en-IN")}
function updateCartCount(){document.querySelectorAll("[data-cart-count]").forEach(e=>e.textContent=getCart().reduce((s,i)=>s+i.qty,0))}
function toast(m){const t=document.querySelector(".toast");if(!t)return;t.textContent=m;t.classList.add("show");setTimeout(()=>t.classList.remove("show"),1800)}
function chooseSize(btn){const wrap=btn.closest(".size-row");wrap.querySelectorAll(".size-option").forEach(x=>x.classList.remove("selected"));btn.classList.add("selected")}
function selectedSizeFor(id){
  const card=document.querySelector(`[data-product-id="${id}"]`);
  return card?.querySelector(".size-option.selected")?.dataset.size || "M";
}
function addToCart(id,size=null){
  const p=PRODUCTS.find(x=>x.id===id);if(!p)return;
  const chosen=size||selectedSizeFor(id), c=getCart();
  const existing=c.find(x=>x.id===id&&x.size===chosen);
  if(existing)existing.qty++;else c.push({id,qty:1,size:chosen});
  saveCart(c);toast(`${p.name} · ${chosen} added to cart`);
}
function removeFromCart(id,size){
  saveCart(getCart().filter(i=>!(i.id===id&&i.size===size)));renderOrderSummary();
}
function changeQty(id,size,d){
  const c=getCart(),i=c.find(x=>x.id===id&&x.size===size);if(!i)return;
  i.qty+=d;if(i.qty<=0)return removeFromCart(id,size);
  saveCart(c);renderOrderSummary();
}
function productCard(p){
  return `<article class="card product-clickable" data-product-id="${p.id}" data-category="${p.category}" onclick="openProduct(event,'${p.id}')">
    <div class="card-image"><img src="${p.image}" alt="${p.name}"></div>
    <div class="card-body">
      <span class="tag">${p.tag}</span>
      <div class="card-title">${p.name}</div>
      <div class="card-meta">${p.category}</div>
      <div class="card-price">${money(p.price)}</div>
      <div class="card-meta">${p.color}</div>
      <div class="size-row compact-sizes">
        ${p.sizes.map(s=>`<button type="button" class="size-option ${s==="M"?"selected":""}" data-size="${s}" onclick="event.stopPropagation();chooseSize(this)">${s}</button>`).join("")}
      </div>
      <div class="card-actions">
        <button class="btn alt" onclick="event.stopPropagation();openProduct(event,'${p.id}')">View product</button>
        <button class="btn full" onclick="event.stopPropagation();addToCart('${p.id}')">Add to cart</button>
      </div>
    </div>
  </article>`;
}
function openProduct(event,id){if(event)event.preventDefault();location.href=`product.html?id=${encodeURIComponent(id)}`}
function renderProducts(){const g=document.querySelector("[data-products]");if(g)g.innerHTML=PRODUCTS.map(productCard).join("")}
function filterProducts(category){
  document.querySelectorAll("[data-filter]").forEach(b=>b.classList.toggle("active",b.dataset.filter===category));
  document.querySelectorAll(".card[data-category]").forEach(c=>c.style.display=(category==="All"||c.dataset.category===category)?"":"none");
}
function renderOrderSummary(){
  const b=document.querySelector("[data-summary]");if(!b)return;
  const c=getCart();if(!c.length){b.innerHTML='<div class="empty">Your cart is empty.<br><br><a class="btn alt" href="index.html#shop">Shop collection</a></div>';return}
  let total=0;
  b.innerHTML=c.map(i=>{
    const p=PRODUCTS.find(x=>x.id===i.id);if(!p)return "";total+=p.price*i.qty;
    return `<div class="summary-item"><img src="${p.image}" alt=""><div class="summary-info"><strong>${p.name}</strong><span>${money(p.price)} × ${i.qty}</span><span>Size: ${i.size}</span><div style="display:flex;gap:6px;margin-top:8px"><button class="btn alt" style="padding:5px 9px" onclick="changeQty('${p.id}','${i.size}',-1)">−</button><button class="btn alt" style="padding:5px 9px" onclick="changeQty('${p.id}','${i.size}',1)">+</button><button class="btn alt" style="padding:5px 9px" onclick="removeFromCart('${p.id}','${i.size}')">Remove</button></div></div></div>`;
  }).join("")+`<div class="total"><span>Total</span><span>${money(total)}</span></div>`;
}
async function submitOrder(e){
  e.preventDefault();
  const c=getCart();if(!c.length){toast("Add a product first");return}
  const f=e.target;if(!f.checkValidity()){f.reportValidity();return}
  const method=f.querySelector('input[name="payment"]:checked')?.value,data=Object.fromEntries(new FormData(f).entries());
  if(method==="upi"&&!data.upiId){document.querySelector("#upiId").focus();toast("Enter your UPI ID");return}
  const payload={customer:{name:data.name,phone:data.phone,email:data.email,address:data.address,city:data.city,pin:data.pin},payment:method,upiId:data.upiId||"",items:c.map(i=>({id:i.id,qty:i.qty,size:i.size}))};
  try{const res=await fetch("/api/orders",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});const out=await res.json();if(!res.ok)throw new Error(out.error||"Unable to place order");localStorage.setItem(ORDER_KEY,JSON.stringify(out.order));localStorage.removeItem(CART_KEY);location.href="success.html"}catch(err){toast(err.message)}
}
async function loadSuccess(){
  const o=document.querySelector("[data-success]");if(!o)return;
  const local=JSON.parse(localStorage.getItem(ORDER_KEY)||"null");if(!local){o.innerHTML='<div class="empty">No recent order found.</div>';return}
  const names=(local.items||[]).map(i=>`${PRODUCTS.find(x=>x.id===i.id)?.name||"Item"} × ${i.qty} · ${i.size}`).join(", ");
  o.innerHTML=`<div class="success"><div class="success-mark">✓</div><div class="kicker">ORDER CONFIRMED</div><h1 class="page-title">Thank you.</h1><p>Your order has been placed successfully. Your order is now visible to THE ERA owner for processing.</p><div class="order-id">${local.orderId}</div><div class="panel" style="text-align:left"><strong>Items</strong><p style="color:#666;margin:7px 0 18px">${names}</p><div class="total"><span>Total</span><span>${money(local.total)}</span></div><div class="notice"><strong>Payment:</strong> ${local.payment==="cod"?"Cash on Delivery":"UPI"}</div></div><br><div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap"><a class="btn" href="my-orders.html">Track my order</a><a class="btn alt" href="index.html">Continue shopping</a></div></div>`
}
document.addEventListener("DOMContentLoaded",()=>{
  updateCartCount();renderProducts();renderOrderSummary();loadSuccess();
  document.querySelectorAll('input[name="payment"]').forEach(r=>r.addEventListener("change",()=>{const wrap=document.querySelector("[data-upi-wrap]");if(wrap)wrap.style.display=r.value==="upi"&&r.checked?"block":"none"}));
  const f=document.querySelector("[data-order-form]");if(f)f.addEventListener("submit",submitOrder);
});
