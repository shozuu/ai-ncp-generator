import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

export const exportUtils = {
  async toPDF(ncp, columnLabels = null, isFormatted = false) {
    const doc = new jsPDF('landscape')

    const columns =
      columnLabels ||
      Object.keys(ncp).map(key => key.charAt(0).toUpperCase() + key.slice(1))

    // Process text based on whether it's formatted array data or raw text
    const processTextForTable = data => {
      if (isFormatted && Array.isArray(data)) {
        // Add spacing between array items for better readability
        return data
          .map((line, index) => {
            // Add extra spacing after numbered items, bullets, or important sections
            if (index < data.length - 1) {
              const currentLine = line.trim()
              const nextLine = data[index + 1]?.trim()

              const isCurrentNumbered = currentLine.match(/^\d+\./)
              const isCurrentBullet = currentLine.startsWith('-')
              const isNextNumbered = nextLine?.match(/^\d+\./)
              const isNextBullet = nextLine?.startsWith('-')

              // Add extra spacing between different content types
              if (
                (isCurrentNumbered && !isNextNumbered) ||
                (isCurrentBullet && !isNextBullet) ||
                (!isCurrentNumbered &&
                  !isCurrentBullet &&
                  (isNextNumbered || isNextBullet))
              ) {
                return line + '\n' // Add extra line break
              }
            }
            return line
          })
          .join('\n')
      } else {
        // Handle raw text data
        if (!data) return ''
        const lines = data
          .split('\n')
          .map(line => line.trim())
          .filter(line => line.length > 0)
        return lines.join('\n')
      }
    }

    // Format data for table with enhanced spacing
    const tableData = [
      Object.values(ncp).map(value => processTextForTable(value)),
    ]

    // Add title
    doc.setFontSize(20)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(46, 46, 56)
    doc.text('Nursing Care Plan', doc.internal.pageSize.width / 2, 20, {
      align: 'center',
    })

    // Create table with enhanced styling
    autoTable(doc, {
      head: [columns],
      body: tableData,
      startY: 30,
      theme: 'grid',
      styles: {
        fontSize: 9,
        cellPadding: { top: 6, right: 5, bottom: 6, left: 5 }, // Increased padding
        valign: 'top',
        halign: 'left',
        lineColor: [226, 232, 240],
        lineWidth: 0.5,
        textColor: [51, 65, 85],
        fontStyle: 'normal',
        font: 'helvetica',
        overflow: 'linebreak',
        cellWidth: 'wrap',
        lineHeight: 1.6, // Increased line height for better spacing
      },
      headStyles: {
        fillColor: [30, 41, 59],
        textColor: [248, 250, 252],
        fontStyle: 'bold',
        fontSize: 10,
        halign: 'center',
        cellPadding: { top: 8, right: 6, bottom: 8, left: 6 },
      },
      bodyStyles: {
        fillColor: [255, 255, 255],
        minCellHeight: 20,
        cellPadding: { top: 6, right: 5, bottom: 6, left: 5 },
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
      columnStyles: {
        ...Object.fromEntries(
          columns.map((_, index) => [
            index,
            {
              cellWidth: 'auto',
              minCellWidth: 35,
              maxCellWidth: 55,
            },
          ])
        ),
      },
      margin: { top: 30, right: 12, bottom: 20, left: 12 },
      tableWidth: 'auto',
      showHead: 'everyPage',
      pageBreak: 'auto',
      rowPageBreak: 'avoid',

      didDrawPage: function (data) {
        const pageSize = doc.internal.pageSize

        doc.setFontSize(8)
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(148, 163, 184)

        // Use doc.internal.getNumberOfPages() as fallback if data.pageCount is undefined
        const totalPages = data.pageCount || doc.internal.getNumberOfPages()
        const pageText = `Page ${data.pageNumber} of ${totalPages}`
        const pageTextWidth = doc.getTextWidth(pageText)
        doc.text(
          pageText,
          pageSize.width - pageTextWidth - 12,
          pageSize.height - 12
        )

        const date = new Date().toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        })
        doc.text(`Generated: ${date}`, 12, pageSize.height - 12)

        doc.setDrawColor(226, 232, 240)
        doc.setLineWidth(0.3)
        doc.line(
          12,
          pageSize.height - 18,
          pageSize.width - 12,
          pageSize.height - 18
        )
      },

      didParseCell: function (data) {
        if (data.section === 'body') {
          if (typeof data.cell.raw === 'string' && data.cell.raw.length > 50) {
            data.cell.styles.cellPadding = {
              top: 8,
              right: 6,
              bottom: 8,
              left: 6,
            }
            data.cell.styles.fontSize = 8.5
            data.cell.styles.lineHeight = 1.7
          } else {
            data.cell.styles.cellPadding = {
              top: 6,
              right: 5,
              bottom: 6,
              left: 5,
            }
            data.cell.styles.lineHeight = 1.6
          }
        }
      },
    })

    doc.save('nursing-care-plan.pdf')
  },

  toWord(ncp, columnLabels = null, isFormatted = false) {
    const columns =
      columnLabels ||
      Object.keys(ncp).map(key => key.charAt(0).toUpperCase() + key.slice(1))

    // Process text for Word with proper spacing
    const processTextForWord = data => {
      if (isFormatted && Array.isArray(data)) {
        return data
          .map((line, index) => {
            if (index < data.length - 1) {
              const currentLine = line.trim()
              const nextLine = data[index + 1]?.trim()

              const isCurrentNumbered = currentLine.match(/^\d+\./)
              const isCurrentBullet = currentLine.startsWith('-')
              const isNextNumbered = nextLine?.match(/^\d+\./)
              const isNextBullet = nextLine?.startsWith('-')

              // Add spacing between different content types
              if (
                (isCurrentNumbered && !isNextNumbered) ||
                (isCurrentBullet && !isNextBullet) ||
                (!isCurrentNumbered &&
                  !isCurrentBullet &&
                  (isNextNumbered || isNextBullet))
              ) {
                return line + '<br><br>'
              }
            }
            return line
          })
          .join('<br>')
      } else {
        return (data || '').toString().replace(/\n/g, '<br>')
      }
    }

    // Calculate dynamic column width based on number of columns
    const columnWidth = Math.floor(100 / columns.length)

    const tableHeader = columns
      .map(
        col =>
          `<th style="
            border: 1pt solid #4a5568; 
            padding: 8pt 6pt; 
            background-color: #2d3748;
            color: #ffffff; 
            font-weight: bold; 
            text-align: center;
            font-size: 10pt;
            font-family: 'Calibri', 'Arial', sans-serif;
            width: ${columnWidth}%;
            vertical-align: middle;
          ">${col}</th>`
      )
      .join('')

    const tableData = Object.values(ncp)
      .map((value, index) => {
        const cellContent = processTextForWord(value)
        return `<td style="
          border: 0.5pt solid #cbd5e0; 
          padding: 8pt 6pt; 
          vertical-align: top;
          font-size: 9pt;
          line-height: 1.4;
          font-family: 'Calibri', 'Arial', sans-serif;
          background-color: ${index % 2 === 0 ? '#f7fafc' : '#ffffff'};
          width: ${columnWidth}%;
        ">${cellContent}</td>`
      })
      .join('')

    const content = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
        <head>
          <meta charset="utf-8">
          <meta name="ProgId" content="Word.Document">
          <meta name="Generator" content="Microsoft Word 15">
          <meta name="Originator" content="Microsoft Word 15">
          <title>Nursing Care Plan</title>
          <!--[if gte mso 9]>
          <xml>
            <w:WordDocument>
              <w:View>Print</w:View>
              <w:Zoom>100</w:Zoom>
              <w:DoNotPromptForConvert/>
              <w:DoNotShowInsertionsAndDeletions/>
            </w:WordDocument>
          </xml>
          <![endif]-->
          <style>
            @page {
              size: 11.0in 8.5in;
              margin: 0.5in 0.5in 0.5in 0.5in;
              mso-page-orientation: landscape;
              mso-header-margin: 0.5in;
              mso-footer-margin: 0.5in;
            }
            
            @page Section1 {
              size: 11.0in 8.5in;
              margin: 0.5in 0.5in 0.5in 0.5in;
              mso-page-orientation: landscape;
              mso-header-margin: 0.5in;
              mso-footer-margin: 0.5in;
            }
            
            div.Section1 {
              page: Section1;
            }
            
            body { 
              font-family: 'Calibri', 'Arial', sans-serif; 
              margin: 0;
              padding: 0;
              background-color: #ffffff;
              color: #2d3748;
              font-size: 9pt;
              line-height: 1.4;
            }
            
            h1 { 
              color: #2d3748; 
              margin: 0 0 12pt 0; 
              text-align: center;
              font-size: 16pt;
              font-weight: bold;
              font-family: 'Calibri', 'Arial', sans-serif;
              border-bottom: 2pt solid #4299e1;
              padding-bottom: 6pt;
              page-break-after: avoid;
              page-break-inside: avoid;
              keep-with-next: always;
            }
            
            .header-table-container {
              page-break-inside: avoid;
              page-break-after: avoid;
              keep-together: always;
            }
            
            table { 
              width: 100%; 
              border-collapse: collapse;
              margin: 0;
              table-layout: fixed;
              border: 1pt solid #4a5568;
              font-family: 'Calibri', 'Arial', sans-serif;
              page-break-inside: auto;
              page-break-after: auto;
            }
            
            thead {
              display: table-header-group;
              page-break-inside: avoid;
              page-break-after: avoid;
            }
            
            tbody {
              display: table-row-group;
              page-break-inside: auto;
            }
            
            th {
              border: 1pt solid #4a5568;
              background-color: #2d3748;
              color: #ffffff;
              font-weight: bold;
              text-align: center;
              vertical-align: middle;
              padding: 8pt 6pt;
              font-size: 10pt;
              page-break-inside: avoid;
              page-break-after: avoid;
            }
            
            td {
              border: 0.5pt solid #cbd5e0;
              vertical-align: top;
              padding: 8pt 6pt;
              font-size: 9pt;
              line-height: 1.4;
              page-break-inside: auto;
            }
            
            tr {
              page-break-inside: avoid;
            }
            
            .footer {
              margin-top: 16pt;
              text-align: center;
              font-size: 8pt;
              color: #718096;
              border-top: 0.5pt solid #e2e8f0;
              padding-top: 8pt;
              font-family: 'Calibri', 'Arial', sans-serif;
              page-break-inside: avoid;
            }
            
            /* Word-specific styles */
            p {
              margin: 0;
              padding: 0;
              line-height: 1.4;
            }
            
            /* Force content to stay together */
            .content-wrapper {
              page-break-inside: avoid;
            }
            
            /* Microsoft Word compatibility */
            @media print {
              @page {
                size: 11.0in 8.5in;
                margin: 0.5in;
                orientation: landscape;
              }
              
              h1 {
                page-break-after: avoid;
                keep-with-next: always;
              }
              
              thead {
                display: table-header-group;
              }
              
              .header-table-container {
                page-break-inside: avoid;
              }
            }
            
            /* Additional Word-specific page break controls */
            .no-break {
              page-break-inside: avoid;
              page-break-before: avoid;
              page-break-after: avoid;
            }
          </style>
        </head>
        <body>
          <div class="Section1">
            <div class="content-wrapper">
              <h1 class="no-break">Nursing Care Plan</h1>
              <div class="header-table-container no-break">
                <table>
                  <thead class="no-break">
                    <tr class="no-break">${tableHeader}</tr>
                  </thead>
                  <tbody>
                    <tr>${tableData}</tr>
                  </tbody>
                </table>
              </div>
            </div>
            <div class="footer">
              Generated on ${new Date().toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })} | AI-NCP Generator
            </div>
          </div>
        </body>
      </html>
    `

    const blob = new Blob(['\ufeff', content], {
      type: 'application/vnd.ms-word',
    })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = 'nursing-care-plan.doc'
    link.click()
  },

  async toPNG(ncp, columnLabels = null, isFormatted = false) {
    const columns =
      columnLabels ||
      Object.keys(ncp).map(key => key.charAt(0).toUpperCase() + key.slice(1))

    // Process text for PNG with proper spacing
    const processTextForPNG = data => {
      if (isFormatted && Array.isArray(data)) {
        return data
          .map((line, index) => {
            if (index < data.length - 1) {
              const currentLine = line.trim()
              const nextLine = data[index + 1]?.trim()

              const isCurrentNumbered = currentLine.match(/^\d+\./)
              const isCurrentBullet = currentLine.startsWith('-')
              const isNextNumbered = nextLine?.match(/^\d+\./)
              const isNextBullet = nextLine?.startsWith('-')

              if (
                (isCurrentNumbered && !isNextNumbered) ||
                (isCurrentBullet && !isNextBullet) ||
                (!isCurrentNumbered &&
                  !isCurrentBullet &&
                  (isNextNumbered || isNextBullet))
              ) {
                return line + '<br><br>'
              }
            }
            return line
          })
          .join('<br>')
      } else {
        return (data || '').toString().replace(/\n/g, '<br>')
      }
    }

    const container = document.createElement('div')
    container.style.cssText = `
      padding: 40px;
      background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
      width: 1500px;
      font-family: system-ui, -apple-system, sans-serif;
      box-shadow: 0 25px 50px rgba(0, 0, 0, 0.15);
      border-radius: 16px;
    `

    const title = document.createElement('h1')
    title.textContent = 'Nursing Care Plan'
    title.style.cssText = `
      margin: 0 0 40px 0;
      font-size: 32px;
      color: #1e293b;
      text-align: center;
      font-weight: 700;
      letter-spacing: -0.025em;
      text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    `
    container.appendChild(title)

    // Create table with enhanced styling
    const table = document.createElement('table')
    table.style.cssText = `
      width: 100%;
      border-collapse: separate;
      border-spacing: 0;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
      border-radius: 12px;
      overflow: hidden;
      background: white;
      border: 1px solid #e2e8f0;
    `

    // Create header
    const thead = document.createElement('thead')
    const headerRow = document.createElement('tr')
    columns.forEach((col, index) => {
      const th = document.createElement('th')
      th.textContent = col
      th.style.cssText = `
        border: none;
        padding: 20px 16px;
        background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
        color: #f8fafc;
        font-weight: 600;
        text-align: center;
        font-size: 13px;
        letter-spacing: 0.5px;
        text-transform: uppercase;
        ${index === 0 ? 'border-top-left-radius: 12px;' : ''}
        ${index === columns.length - 1 ? 'border-top-right-radius: 12px;' : ''}
      `
      headerRow.appendChild(th)
    })
    thead.appendChild(headerRow)
    table.appendChild(thead)

    // Create body
    const tbody = document.createElement('tbody')
    const dataRow = document.createElement('tr')
    Object.values(ncp).forEach((value, index) => {
      const td = document.createElement('td')
      td.innerHTML = processTextForPNG(value)
      td.style.cssText = `
        border: 1px solid #e2e8f0;
        border-top: none;
        padding: 24px 18px;
        vertical-align: top;
        font-size: 11px;
        line-height: 1.8;
        background-color: ${index % 2 === 0 ? '#f8fafc' : '#ffffff'};
      `
      dataRow.appendChild(td)
    })
    tbody.appendChild(dataRow)
    table.appendChild(tbody)
    container.appendChild(table)

    const footer = document.createElement('div')
    footer.textContent = `Generated on ${new Date().toLocaleDateString(
      'en-US',
      {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }
    )} | AI-NCP Generator`
    footer.style.cssText = `
      margin-top: 30px;
      text-align: center;
      font-size: 11px;
      color: #64748b;
      font-weight: 500;
      letter-spacing: 0.025em;
    `
    container.appendChild(footer)

    document.body.appendChild(container)

    try {
      const canvas = await html2canvas(container, {
        backgroundColor: 'transparent',
        scale: 2.5,
        useCORS: true,
        allowTaint: true,
        width: 1500,
        height: container.offsetHeight,
      })

      const link = document.createElement('a')
      link.href = canvas.toDataURL('image/png')
      link.download = 'nursing-care-plan.png'
      link.click()
    } finally {
      document.body.removeChild(container)
    }
  },

  toCSV(ncp, columnLabels = null, isFormatted = false) {
    const columns =
      columnLabels ||
      Object.keys(ncp).map(key => key.charAt(0).toUpperCase() + key.slice(1))

    const headers = columns.map(col => `"${col}"`).join(',')
    const values = Object.values(ncp)
      .map(value => {
        let cleanValue
        if (isFormatted && Array.isArray(value)) {
          cleanValue = value.join(' | ') // Join array items with separator
        } else {
          cleanValue = (value || '').toString().replace(/\n/g, ' | ')
        }

        return `"${cleanValue.replace(/"/g, '""').trim()}`
      })
      .join(',')

    const csvContent = `${headers}\n${values}`

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = 'nursing-care-plan.csv'
    link.click()
  },
}
