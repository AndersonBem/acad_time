async function carregarSidebar() {
  const container = document.getElementById("sidebar-container");

  if (!container) return;

  try {
    const response = await fetch("componentes/sidebar.html");

    if (!response.ok) {
      throw new Error("Erro ao carregar sidebar.");
    }

    const html = await response.text();
    container.innerHTML = html;

  } catch (error) {
    console.error(error);
  }
}

function logout() {
  localStorage.removeItem("access_token");
  sessionStorage.clear();
  window.location.href = "login.html";
}

document.addEventListener("DOMContentLoaded", carregarSidebar);