export const passwordResetTemplate = `<h1>Solicitud de Restablecimiento de Contraseña</h1>
<p>¡Hola!</p>
<p>Hemos recibido una solicitud para restablecer la contraseña de tu cuenta en Veretragna. Por favor, haz clic en el botón de abajo para establecer una nueva contraseña:</p>

<div style="text-align: center; margin: 30px 0;">
    <a href="<%= it.resetLink %>" class="button">Restablecer Contraseña</a>
</div>

<p>Si el botón de arriba no funciona, puedes copiar y pegar el siguiente enlace en tu navegador:</p>
<p><a href="<%= it.resetLink %>" class="link"><%= it.resetLink %></a></p>

<p><strong>Nota:</strong> Este enlace caducará en 1 hora.</p>

<p>Si no has solicitado el restablecimiento de contraseña, por favor ignora este correo o contacta con soporte si tienes preocupaciones sobre la seguridad de tu cuenta.</p>

<p>Saludos cordiales,<br>El Equipo de Veretragna</p>`; 