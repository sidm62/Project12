let ostoskori = JSON.parse(localStorage.getItem('ostoskori')) || [];
updateCart();

function lisaaKoriin(name, price) {
    const modal = document.getElementById("menuModal");
    const title = document.getElementById("modal-title");
    const text = document.getElementById("modal-text");
    const footer = document.getElementById("modal-footer");
    const icon = document.getElementById("modal-icon");


    icon.innerHTML = "🍔";
    title.innerText = "Lisätäänkö koriin?";
    text.innerText = `Haluatko lisätä tuotteen "${name}" ostoskoriin?`;


    footer.innerHTML = `
        <button class="btn-cancel" onclick="closeMenuModal()">Peruuta</button>
        <button class="btn-confirm" id="confirm-add-action">Lisää</button>
    `;

    modal.style.display = "flex";


    document.getElementById("confirm-add-action").onclick = function() {

        const existingProduct = ostoskori.find(item => item.name === name);
        if (existingProduct) {
            existingProduct.amount += 1;
        } else {
            ostoskori.push({ name: name, price: price, amount: 1, extra: "" });
        }

        localStorage.setItem('ostoskori', JSON.stringify(ostoskori));
        updateCart();


        icon.innerHTML = "✅";
        title.innerText = "Onnistui!";
        text.innerText = `${name} on nyt lisätty ostoskoriin.`;
        footer.innerHTML = `<button class="btn-confirm" onclick="closeMenuModal()" style="width: 100%;">Selvä</button>`;
    };
}

function closeMenuModal() {
    document.getElementById("menuModal").style.display = "none";
}

function updateCart() {
    const count = document.getElementById('cart-count');
    if (count) {
        const totalItems = ostoskori.reduce((sum, item) => sum + item.amount, 0);
        count.innerText = totalItems;
    }
}