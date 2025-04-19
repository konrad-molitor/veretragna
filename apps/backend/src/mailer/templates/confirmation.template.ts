export const confirmationTemplate = `<h1>Confirmación de Registro</h1>
<p>¡Hola!</p>
<p>Gracias por registrarte en Veretragna. Para completar tu registro, por favor haz clic en el botón de abajo:</p>

<div style="text-align: center; margin: 30px 0;">
    <a href="<%= it.confirmationLink %>" class="button">Confirmar Registro</a>
</div>

<p>Si el botón de arriba no funciona, puedes copiar y pegar el siguiente enlace en tu navegador:</p>
<p><a href="<%= it.confirmationLink %>" class="link"><%= it.confirmationLink %></a></p>

<p>Saludos cordiales,<br>El Equipo de Veretragna</p>`; 