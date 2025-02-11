window.addEventListener("load", function() {
    // Hide preloader after page fully loads
    const preloader = document.getElementById("preloader");
    preloader.style.display = "none";

    // Show the content
    document.querySelector(".content").style.display = "block";
});