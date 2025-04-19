export const emailLayoutTemplate = `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><%= it.subject %></title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 0;
            background-color: #f9fafb;
        }
        .email-container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
        }
        .email-header {
            background-color: #ffffff;
            border-bottom: 3px solid #ef4444;
            padding: 24px;
            text-align: center;
        }
        .email-header img {
            max-height: 60px;
        }
        .email-content {
            padding: 32px 24px;
        }
        .email-footer {
            background-color: #f3f4f6;
            padding: 16px 24px;
            text-align: center;
            font-size: 12px;
            color: #6b7280;
        }
        h1 {
            color: #1f2937;
            font-size: 24px;
            margin-top: 0;
            margin-bottom: 16px;
        }
        p {
            margin-bottom: 16px;
        }
        .button {
            display: inline-block;
            background-color: #ef4444;
            color: #ffffff !important;
            text-decoration: none;
            padding: 12px 24px;
            border-radius: 50px;
            font-weight: 500;
            margin-top: 8px;
            margin-bottom: 8px;
        }
        .button:hover {
            background-color: #dc2626;
        }
        .link {
            color: #ef4444;
            text-decoration: underline;
        }
        @media screen and (max-width: 600px) {
            .email-container {
                width: 100%;
                border-radius: 0;
            }
            .email-content {
                padding: 24px 16px;
            }
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="email-header">
            <img src="https://veretragna.ivaliev.dev/assets/images/logo.png" alt="Veretragna Logo">
        </div>
        <div class="email-content">
            <%~ it.content %>
        </div>
        <div class="email-footer">
            © <%= new Date().getFullYear() %> Veretragna. Todos los derechos reservados.
            <p>Si no has solicitado este correo, por favor ignóralo.</p>
        </div>
    </div>
</body>
</html>`;
