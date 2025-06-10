export const paymentConfirmationTemplate = `<h1>¡Pago Confirmado!</h1>
<p>¡Hola <%= it.customerName %>!</p>
<p>Su pago ha sido <strong>procesado exitosamente</strong>. Su reserva "<strong><%= it.tripName %></strong>" está ahora confirmada.</p>

<div style="background-color: #d4edda; border: 1px solid #c3e6cb; padding: 20px; border-radius: 8px; margin: 20px 0;">
    <h3 style="margin-top: 0; color: #155724;">✅ Reserva Confirmada</h3>
    <p style="color: #155724; margin-bottom: 0;"><strong>Su pago de $<%= it.price %> ha sido confirmado</strong></p>
</div>

<div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
    <h3 style="margin-top: 0; color: #495057;">Detalles de su Reserva:</h3>
    <p><strong>Nombre:</strong> <%= it.tripName %></p>
    <% if (it.description) { %>
    <p><strong>Descripción:</strong> <%= it.description %></p>
    <% } %>
    <p><strong>Fecha y Hora:</strong> <%= it.startDateTime %></p>
    <p><strong>Precio Pagado:</strong> $<%= it.price %></p>
    <p><strong>Asientos Reservados:</strong> <%= it.maxSeats %></p>
    <% if (it.route && it.route.length > 0) { %>
    <p><strong>Ruta:</strong></p>
    <ul style="margin-left: 20px;">
        <% it.route.forEach(function(stop, index) { %>
        <li><%= stop.name %> - <%= stop.address %></li>
        <% }); %>
    </ul>
    <% } %>
</div>

<div style="background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 20px; border-radius: 8px; margin: 20px 0;">
    <h3 style="margin-top: 0; color: #856404;">Información Importante:</h3>
    <p style="color: #856404; margin-bottom: 10px;">• Conserve este correo como comprobante de pago</p>
    <p style="color: #856404; margin-bottom: 10px;">• Llegue al punto de partida 15 minutos antes</p>
    <p style="color: #856404; margin-bottom: 0;">• Para cualquier consulta, contacte con nuestro equipo</p>
</div>

<div style="text-align: center; margin: 30px 0;">
    <a href="<%= it.tripUrl %>" class="button">Ver Detalles de la Reserva</a>
</div>

<p>Si tiene alguna pregunta sobre su reserva confirmada, no dude en contactarnos.</p>

<p>¡Que disfrute su viaje!</p>

<p>Saludos cordiales,<br>El Equipo de Veretragna</p>`;