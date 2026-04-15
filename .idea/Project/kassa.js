function tilaus(event) {
    event.preventDefault();

    let ostoskori = JSON.parse(localStorage.getItem('ostoskori')) || [];

    if (ostoskori.length === 0) {
        console.log("Ostoskori is be empty");
        return;
    }
    document.getElementById("confirmModal").style.display = "flex";
}
function processOrder() {

    localStorage.removeItem('ostoskori');

    window.location.href= "Tilaus.html";

}

function closeModal() {
    document.getElementById("confirmModal").style.display = "none";
}