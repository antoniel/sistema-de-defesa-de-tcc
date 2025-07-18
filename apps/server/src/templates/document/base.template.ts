export const baseDocumentTemplate = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{title}}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: "Times New Roman", serif;
            font-size: 12pt;
            line-height: 1.6;
            color: #000;
            background: #fff;
        }

        .document-container {
            max-width: 210mm;
            margin: 0 auto;
            padding: 20mm;
            min-height: 297mm;
        }

        .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 2px solid #333;
            padding-bottom: 20px;
        }

        .header h1 {
            font-size: 16pt;
            font-weight: bold;
            margin-bottom: 10px;
            text-transform: uppercase;
        }

        .header h2 {
            font-size: 14pt;
            font-weight: normal;
            margin-bottom: 5px;
        }

        .header p {
            font-size: 12pt;
            color: #666;
        }

        .content {
            margin-bottom: 30px;
        }

        .section {
            margin-bottom: 20px;
        }

        .section h3 {
            font-size: 14pt;
            font-weight: bold;
            margin-bottom: 10px;
            color: #333;
        }

        .info-row {
            display: flex;
            margin-bottom: 8px;
            justify-content: space-between;
            align-items: flex-start;
        }

        .info-label {
            font-weight: bold;
            min-width: 150px;
            flex-shrink: 0;
        }

        .info-value {
            flex: 1;
            text-align: left;
        }

        .members-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 15px;
        }

        .members-table th,
        .members-table td {
            border: 1px solid #333;
            padding: 8px;
            text-align: left;
        }

        .members-table th {
            background-color: #f0f0f0;
            font-weight: bold;
        }

        .signature-section {
            margin-top: 50px;
            page-break-inside: avoid;
        }

        .signature-block {
            margin-bottom: 50px;
        }

        .signature-line {
            border-bottom: 1px solid #333;
            min-height: 50px;
            margin-bottom: 10px;
        }

        .signature-label {
            text-align: center;
            font-size: 10pt;
            font-weight: bold;
        }

        .footer {
            position: fixed;
            bottom: 20mm;
            left: 20mm;
            right: 20mm;
            text-align: center;
            font-size: 10pt;
            color: #666;
            border-top: 1px solid #ccc;
            padding-top: 10px;
        }

        .page-break {
            page-break-before: always;
        }

        .text-center {
            text-align: center;
        }

        .text-right {
            text-align: right;
        }

        .text-left {
            text-align: left;
        }

        .font-bold {
            font-weight: bold;
        }

        .font-italic {
            font-style: italic;
        }

        .mt-10 {
            margin-top: 10px;
        }

        .mt-20 {
            margin-top: 20px;
        }

        .mt-30 {
            margin-top: 30px;
        }

        .mb-10 {
            margin-bottom: 10px;
        }

        .mb-20 {
            margin-bottom: 20px;
        }

        .mb-30 {
            margin-bottom: 30px;
        }

        .p-10 {
            padding: 10px;
        }

        .border {
            border: 1px solid #333;
        }

        .bg-light {
            background-color: #f8f9fa;
        }

        @media print {
            body {
                print-color-adjust: exact;
                -webkit-print-color-adjust: exact;
            }
            
            .document-container {
                margin: 0;
                padding: 0;
            }
            
            .page-break {
                page-break-before: always;
            }
        }
    </style>
</head>
<body>
    <div class="document-container">
        {{content}}
    </div>
    
    <div class="footer">
        <p>Documento gerado automaticamente em {{date}} às {{time}}</p>
    </div>
</body>
</html>
`