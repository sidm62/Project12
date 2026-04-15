let ostoskori = JSON.parse(localStorage.getItem('ostoskori')) || [];

updateCart();

document.querySelectorAll('.add-to-cart').forEach(button => {
    button.addEventListener('click', (e) => {
        const card = e.target.closest('.menu-card');
        const name = card.querySelector('h3').innerText;


        const vastaus = confirm(`Are you sure you want to add ${name}`);
        if (vastaus) {

            const priceText = card.querySelector('.price').innerText;
            const price = parseFloat(priceText.replace(/[^\d.]/g, '').replace(',', '.'));
            addToCart(name, price);

        alert(`${name} added to cart!`);
    } else {
            console.log(`lisäys peruutettiin!`);
        }
    });
});

    function addToCart(name, price) {
        const existingProduct = ostoskori.find(item => item.name === name);

        if (existingProduct) {
            existingProduct.amount += 1;
        } else {
            ostoskori.push({
                name: name,
                price: price,
                amount: 1
            });
        }
        localStorage.setItem('ostoskori', JSON.stringify(ostoskori));
        updateCart();
        console.log(`${name} added to cart`);
    }
    function updateCart() {
        const count = document.getElementById('cart-count');
        if (count) {
            const totalItems = ostoskori.reduce((sum, item) => sum + item.amount, 0);
            count.innerText = totalItems;
        }
    }
