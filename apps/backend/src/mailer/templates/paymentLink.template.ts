export const paymentLinkTemplate = `<h1>Enlace de Pago - Reserva Grupal</h1>
<p>¡Hola <%= it.customerName %>!</p>
<p>Su reserva grupal "<strong><%= it.tripName %></strong>" ha sido creada exitosamente.</p>

<div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
    <h3 style="margin-top: 0; color: #495057;">Detalles de la Reserva:</h3>
    <p><strong>Nombre:</strong> <%= it.tripName %></p>
    <% if (it.description) { %>
    <p><strong>Descripción:</strong> <%= it.description %></p>
    <% } %>
    <p><strong>Fecha y Hora:</strong> <%= it.startDateTime %></p>
    <p><strong>Precio Total:</strong> $<%= it.price %></p>
    <p><strong>Asientos Reservados:</strong> <%= it.maxSeats %></p>
</div>

<p>Para completar su reserva, debe realizar el pago haciendo clic en el botón de abajo:</p>

<div style="text-align: center; margin: 30px 0;">
    <a href="<%= it.paymentLink %>" class="button">Proceder al Pago</a>
</div>

<p>Si el botón de arriba no funciona, puede copiar y pegar el siguiente enlace en su navegador:</p>
<p><a href="<%= it.paymentLink %>" class="link"><%= it.paymentLink %></a></p>

<p><strong>Importante:</strong> Este enlace de pago es único para su reserva. No lo comparta con terceros.</p>

<p>Si tiene alguna pregunta sobre su reserva, no dude en contactarnos.</p>

<p>Saludos cordiales,<br>El Equipo de Veretragna</p>`;