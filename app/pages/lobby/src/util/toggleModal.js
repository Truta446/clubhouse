function toggleModal(modal, action) {
  if (action) {
    document.getElementById(modal).style.display = "flex";
    return;
  }

  document.getElementById(modal).style.display = "none";
}

const modal = document.getElementById('create-room-modal');

window.onclick = function (event) {
  if (event.target == modal) {
    modal.style.display = "none";
  }
}
