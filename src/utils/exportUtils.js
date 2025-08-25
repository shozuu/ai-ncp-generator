import { userService } from '@/services/userService'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import * as XLSX from 'xlsx'

export const exportUtils = {
  async toPDF(ncp, columnLabels = null, isFormatted = false) {
    // Get user details for accountability
    const userDetails = await userService.getUserProfile()

    // Extract title and modification status, remove them from NCP data for table processing
    const { title, is_modified, ...ncpData } = ncp
    const ncpTitle = title || 'Nursing Care Plan'

    // Create PDF with landscape orientation and Letter size (8.5" x 11")
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'in',
      format: [8.5, 11],
    })

    const columns =
      columnLabels ||
      Object.keys(ncpData).map(
        key => key.charAt(0).toUpperCase() + key.slice(1)
      )

    // Process text based on whether it's formatted array data or raw text
    const processTextForTable = data => {
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
                return line + '\n'
              }
            }
            return line
          })
          .join('\n')
      } else {
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
      Object.values(ncpData).map(value => processTextForTable(value)),
    ]

    // Add title with the custom NCP title
    doc.setFontSize(16)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(45, 55, 72) // #2d3748
    doc.text(ncpTitle, doc.internal.pageSize.width / 2, 0.75, {
      align: 'center',
    })

    // Add modification status indicator if modified
    if (is_modified) {
      doc.setFontSize(10)
      doc.setFont('helvetica', 'italic')
      doc.setTextColor(217, 119, 6) // #d97706 - amber color
      doc.text('(Modified by User)', doc.internal.pageSize.width / 2, 0.95, {
        align: 'center',
      })
    }

    // Add title underline similar to Word export
    doc.setDrawColor(66, 153, 225) // #4299e1
    doc.setLineWidth(0.02)
    const titleUnderlineY = is_modified ? 1.05 : 0.9
    doc.line(
      2,
      titleUnderlineY,
      doc.internal.pageSize.width - 2,
      titleUnderlineY
    )

    // Calculate dynamic column width based on number of columns
    const pageWidth = doc.internal.pageSize.width
    const marginLeft = 0.5
    const marginRight = 0.5
    const tableWidth = pageWidth - marginLeft - marginRight
    const columnWidth = tableWidth / columns.length

    // Create table with enhanced styling matching Word export
    autoTable(doc, {
      head: [columns],
      body: tableData,
      startY: is_modified ? 1.3 : 1.2, // Adjust start position if modified
      theme: 'grid',
      styles: {
        fontSize: 9,
        cellPadding: { top: 0.08, right: 0.06, bottom: 0.08, left: 0.06 },
        valign: 'top',
        halign: 'left',
        lineColor: [203, 213, 224],
        lineWidth: 0.007,
        textColor: [45, 55, 72],
        fontStyle: 'normal',
        font: 'helvetica',
        overflow: 'linebreak',
        cellWidth: 'wrap',
        lineHeight: 1.4,
      },
      headStyles: {
        fillColor: [45, 55, 72],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 10,
        halign: 'center',
        valign: 'middle',
        cellPadding: { top: 0.08, right: 0.06, bottom: 0.08, left: 0.06 },
      },
      bodyStyles: {
        fillColor: [255, 255, 255],
        minCellHeight: 0.25,
        cellPadding: { top: 0.08, right: 0.06, bottom: 0.08, left: 0.06 },
      },
      alternateRowStyles: {
        fillColor: [247, 250, 252],
      },
      columnStyles: {
        ...Object.fromEntries(
          columns.map((_, index) => [
            index,
            {
              cellWidth: columnWidth,
              minCellWidth: columnWidth * 0.8,
              maxCellWidth: columnWidth * 1.2,
            },
          ])
        ),
      },
      margin: {
        top: is_modified ? 1.3 : 1.2,
        right: marginRight,
        bottom: 0.8, // Increased for modification notice
        left: marginLeft,
      },
      tableWidth: 'auto',
      showHead: 'everyPage',
      pageBreak: 'auto',
      rowPageBreak: 'avoid',

      didDrawPage: function (data) {
        const pageSize = doc.internal.pageSize

        // Add footer with user details and accountability info
        doc.setFontSize(8)
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(113, 128, 150) // #718096

        const totalPages = data.pageCount || doc.internal.getNumberOfPages()
        const pageText = `Page ${data.pageNumber} of ${totalPages}`
        const pageTextWidth = doc.getTextWidth(pageText)
        doc.text(
          pageText,
          pageSize.width - pageTextWidth - marginRight,
          pageSize.height - 0.4
        )

        const date = new Date().toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })

        // Enhanced footer with user accountability details
        const footerText = `Generated on ${date} | SmartCare`
        const userAccountabilityText = `Created by: ${userDetails.full_name} | ${userDetails.role} | ${userDetails.organization}`

        doc.text(footerText, marginLeft, pageSize.height - 0.4)
        doc.text(userAccountabilityText, marginLeft, pageSize.height - 0.25)

        // Add modification notice in footer if modified
        if (is_modified) {
          doc.setFont('helvetica', 'italic')
          doc.setTextColor(217, 119, 6) // #d97706
          const modificationText =
            'Note: This NCP has been modified from its original AI-generated version'
          doc.text(modificationText, marginLeft, pageSize.height - 0.1)
        }

        // Add footer line
        doc.setDrawColor(226, 232, 240) // #e2e8f0
        doc.setLineWidth(0.007)
        doc.line(
          marginLeft,
          pageSize.height - (is_modified ? 0.7 : 0.55),
          pageSize.width - marginRight,
          pageSize.height - (is_modified ? 0.7 : 0.55)
        )
      },

      didParseCell: function (data) {
        if (data.section === 'head') {
          // Header cell styling to match Word export
          data.cell.styles.lineColor = [74, 85, 104] // #4a5568 - matching Word header
          data.cell.styles.lineWidth = 0.014 // ~1pt converted to inches
        } else if (data.section === 'body') {
          // Body cell styling adjustments for longer content
          if (typeof data.cell.raw === 'string' && data.cell.raw.length > 50) {
            data.cell.styles.cellPadding = {
              top: 0.11,
              right: 0.08,
              bottom: 0.11,
              left: 0.08,
            }
            data.cell.styles.fontSize = 8.5
            data.cell.styles.lineHeight = 1.7
          } else {
            data.cell.styles.cellPadding = {
              top: 0.08,
              right: 0.06,
              bottom: 0.08,
              left: 0.06,
            }
            data.cell.styles.lineHeight = 1.4
          }
        }
      },
    })

    doc.save(`${ncpTitle.toLowerCase().replace(/\s+/g, '-')}.pdf`)
  },

  async toWord(ncp, columnLabels = null, isFormatted = false) {
    // Get user details for accountability
    const userDetails = await userService.getUserProfile()

    // Extract title and modification status, remove them from NCP data for table processing
    const { title, is_modified, ...ncpData } = ncp
    const ncpTitle = title || 'Nursing Care Plan'

    const columns =
      columnLabels ||
      Object.keys(ncpData).map(
        key => key.charAt(0).toUpperCase() + key.slice(1)
      )

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

    const tableData = Object.values(ncpData)
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

    // Add modification status to title if modified
    const titleWithStatus = is_modified
      ? `${ncpTitle} <span style="color: #d97706; font-style: italic; font-weight: normal; font-size: 12pt;">(Modified by User)</span>`
      : ncpTitle

    const content = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
        <head>
          <meta charset="utf-8">
          <meta name="ProgId" content="Word.Document">
          <meta name="Generator" content="Microsoft Word 15">
          <meta name="Originator" content="Microsoft Word 15">
          <title>${ncpTitle}</title>
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
            
            .modification-notice {
              text-align: center;
              font-size: 8pt;
              color: #d97706;
              font-style: italic;
              margin: 6pt 0 12pt 0;
              padding: 4pt 8pt;
              background-color: #fef3c7;
              border: 1pt solid #f59e0b;
              border-radius: 3pt;
              page-break-inside: avoid;
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
            
            .user-accountability {
              margin-top: 8pt;
              text-align: center;
              font-size: 7pt;
              color: #4a5568;
              font-family: 'Calibri', 'Arial', sans-serif;
              font-weight: 500;
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
              <h1 class="no-break">${titleWithStatus}</h1>
              ${is_modified ? '<div class="modification-notice no-break">Note: This Nursing Care Plan has been modified from its original AI-generated version</div>' : ''}
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
              })} | SmartCare
            </div>
            <div class="user-accountability">
              Created by: ${userDetails.full_name} | ${userDetails.role} | ${userDetails.organization}
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
    link.download = `${ncpTitle.toLowerCase().replace(/\s+/g, '-')}.doc`
    link.click()
  },

  async toPNG(ncp, columnLabels = null, isFormatted = false) {
    // Get user details for accountability
    const userDetails = await userService.getUserProfile()

    // Extract title and modification status, remove them from NCP data for table processing
    const { title, is_modified, ...ncpData } = ncp
    const ncpTitle = title || 'Nursing Care Plan'

    const columns =
      columnLabels ||
      Object.keys(ncpData).map(
        key => key.charAt(0).toUpperCase() + key.slice(1)
      )

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
    // Force light theme styles regardless of website theme
    container.style.cssText = `
      padding: 40px;
      background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
      width: 1500px;
      font-family: system-ui, -apple-system, sans-serif;
      box-shadow: 0 25px 50px rgba(0, 0, 0, 0.15);
      border-radius: 16px;
      color: #1e293b !important;
      color-scheme: light !important;
      forced-color-adjust: none !important;
    `

    // Force light theme on container and all descendants
    container.setAttribute('data-theme', 'light')
    container.classList.add('light-theme-export')

    const titleElement = document.createElement('h1')
    titleElement.textContent = ncpTitle
    titleElement.style.cssText = `
      margin: 0 0 ${is_modified ? '20px' : '40px'} 0;
      font-size: 32px;
      color: #1e293b !important;
      text-align: center;
      font-weight: 700;
      letter-spacing: -0.025em;
      text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    `
    container.appendChild(titleElement)

    // Add modification notice if modified
    if (is_modified) {
      const modificationNotice = document.createElement('div')
      modificationNotice.innerHTML = '(Modified by User)'
      modificationNotice.style.cssText = `
        margin: 0 0 20px 0;
        font-size: 16px;
        color: #d97706 !important;
        text-align: center;
        font-weight: 500;
        font-style: italic;
        background: rgba(254, 243, 199, 0.8);
        padding: 8px 16px;
        border-radius: 8px;
        border: 1px solid #f59e0b;
      `
      container.appendChild(modificationNotice)
    }

    // Create table with enhanced styling and forced light theme
    const table = document.createElement('table')
    table.style.cssText = `
      width: 100%;
      border-collapse: separate;
      border-spacing: 0;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
      border-radius: 12px;
      overflow: hidden;
      background: white !important;
      border: 1px solid #e2e8f0;
      color: #1e293b !important;
      margin-bottom: ${is_modified ? '20px' : '30px'};
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
        background: linear-gradient(135deg, #1e293b 0%, #334155 100%) !important;
        color: #f8fafc !important;
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
    Object.values(ncpData).forEach((value, index) => {
      const td = document.createElement('td')
      td.innerHTML = processTextForPNG(value)
      td.style.cssText = `
        border: 1px solid #e2e8f0;
        border-top: none;
        padding: 24px 18px;
        vertical-align: top;
        font-size: 11px;
        line-height: 1.8;
        background-color: ${index % 2 === 0 ? '#f8fafc' : '#ffffff'} !important;
        color: #1e293b !important;
      `
      dataRow.appendChild(td)
    })
    tbody.appendChild(dataRow)
    table.appendChild(tbody)
    container.appendChild(table)

    // Add modification disclaimer if modified
    if (is_modified) {
      const disclaimer = document.createElement('div')
      disclaimer.innerHTML =
        'Note: This Nursing Care Plan has been modified from its original AI-generated version'
      disclaimer.style.cssText = `
        margin-bottom: 20px;
        text-align: center;
        font-size: 11px;
        color: #d97706 !important;
        font-weight: 600;
        background: rgba(254, 243, 199, 0.6);
        padding: 12px 20px;
        border-radius: 8px;
        border: 1px solid #f59e0b;
      `
      container.appendChild(disclaimer)
    }

    // Enhanced footer with user accountability and forced light theme
    const footer = document.createElement('div')
    footer.innerHTML = `
      <div style="margin-bottom: 8px; color: #64748b !important;">Generated on ${new Date().toLocaleDateString(
        'en-US',
        {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        }
      )} | SmartCare</div>
      <div style="font-size: 10px; color: #4a5568 !important; font-weight: 600;">
        Created by: ${userDetails.full_name} | ${userDetails.role} | ${userDetails.organization}
      </div>
    `
    footer.style.cssText = `
      margin-top: 30px;
      text-align: center;
      font-size: 11px;
      color: #64748b !important;
      font-weight: 500;
      letter-spacing: 0.025em;
    `
    container.appendChild(footer)

    // Add CSS to force light theme styles
    const style = document.createElement('style')
    style.textContent = `
      .light-theme-export,
      .light-theme-export * {
        color-scheme: light !important;
        forced-color-adjust: none !important;
      }
      
      .light-theme-export {
        background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%) !important;
        color: #1e293b !important;
      }
      
      .light-theme-export table {
        background: white !important;
        color: #1e293b !important;
      }
      
      .light-theme-export th {
        background: linear-gradient(135deg, #1e293b 0%, #334155 100%) !important;
        color: #f8fafc !important;
      }
      
      .light-theme-export td {
        color: #1e293b !important;
      }
      
      .light-theme-export .footer,
      .light-theme-export .footer * {
        color: #64748b !important;
      }
      
      /* Override any dark mode styles */
      .dark .light-theme-export,
      .dark .light-theme-export *,
      [data-theme="dark"] .light-theme-export,
      [data-theme="dark"] .light-theme-export * {
        color: #1e293b !important;
        background-color: transparent !important;
      }
      
      .dark .light-theme-export table,
      [data-theme="dark"] .light-theme-export table {
        background: white !important;
      }
      
      .dark .light-theme-export th,
      [data-theme="dark"] .light-theme-export th {
        background: linear-gradient(135deg, #1e293b 0%, #334155 100%) !important;
        color: #f8fafc !important;
      }
    `

    document.head.appendChild(style)
    document.body.appendChild(container)

    try {
      const canvas = await html2canvas(container, {
        backgroundColor: '#ffffff',
        scale: 2.5,
        useCORS: true,
        allowTaint: true,
        width: 1500,
        height: container.offsetHeight,
        ignoreElements: element => {
          return element.classList.contains('dark-mode-only')
        },
        onclone: clonedDoc => {
          const clonedContainer = clonedDoc.querySelector('.light-theme-export')
          if (clonedContainer) {
            clonedContainer.setAttribute('data-theme', 'light')
            clonedDoc.documentElement.setAttribute('data-theme', 'light')
            clonedDoc.body.setAttribute('data-theme', 'light')

            clonedDoc.documentElement.classList.remove('dark')
            clonedDoc.body.classList.remove('dark')

            const allElements = clonedContainer.querySelectorAll('*')
            allElements.forEach(el => {
              if (el.tagName !== 'TH') {
                el.style.color = '#1e293b !important'
              }
            })
          }
        },
      })

      const link = document.createElement('a')
      link.href = canvas.toDataURL('image/png')
      link.download = `${ncpTitle.toLowerCase().replace(/\s+/g, '-')}.png`
      link.click()
    } finally {
      document.body.removeChild(container)
      document.head.removeChild(style)
    }
  },

  async toXLSX(ncp, columnLabels = null, isFormatted = false) {
    const userDetails = await userService.getUserProfile()

    // Extract title and modification status, remove them from NCP data for table processing
    const { title, is_modified, ...ncpData } = ncp
    const ncpTitle = title || 'Nursing Care Plan'

    const columns =
      columnLabels ||
      Object.keys(ncpData).map(
        key => key.charAt(0).toUpperCase() + key.slice(1)
      )

    const processTextForExcel = data => {
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
                return line + '\n'
              }
            }
            return line
          })
          .join('\n')
      } else {
        return (data || '').toString()
      }
    }

    const workbook = XLSX.utils.book_new()
    workbook.Props = {
      Title: ncpTitle,
      Subject: is_modified
        ? 'AI-Generated Nursing Care Plan (Modified by User)'
        : 'AI-Generated Nursing Care Plan',
      Author: userDetails.full_name,
      CreatedDate: new Date(),
    }

    const ncpWorksheetData = [
      columns,
      Object.values(ncpData).map(value => processTextForExcel(value)),
    ]

    const ncpWorksheet = XLSX.utils.aoa_to_sheet(ncpWorksheetData)

    const columnWidths = columns.map(() => ({ wch: 40 }))
    ncpWorksheet['!cols'] = columnWidths

    const headerStyle = {
      fill: {
        fgColor: { rgb: 'FF2D3748' },
      },
      font: {
        bold: true,
        color: { rgb: 'FFFFFFFF' },
        sz: 12,
        name: 'Calibri',
      },
      alignment: {
        horizontal: 'center',
        vertical: 'center',
        wrapText: true,
      },
      border: {
        top: { style: 'medium', color: { rgb: 'FF4A5568' } },
        bottom: { style: 'medium', color: { rgb: 'FF4A5568' } },
        left: { style: 'medium', color: { rgb: 'FF4A5568' } },
        right: { style: 'medium', color: { rgb: 'FF4A5568' } },
      },
    }

    const contentStyle = {
      alignment: {
        vertical: 'top',
        horizontal: 'left',
        wrapText: true,
        shrinkToFit: false,
        textRotation: 0,
      },
      font: {
        sz: 10,
        name: 'Calibri',
        color: { rgb: 'FF000000' },
      },
      border: {
        top: { style: 'thin', color: { rgb: 'FFCBD5E0' } },
        bottom: { style: 'thin', color: { rgb: 'FFCBD5E0' } },
        left: { style: 'thin', color: { rgb: 'FFCBD5E0' } },
        right: { style: 'thin', color: { rgb: 'FFCBD5E0' } },
      },
    }

    const headerRange = XLSX.utils.decode_range(ncpWorksheet['!ref'])

    // Style header row (row 0)
    for (let col = headerRange.s.c; col <= headerRange.e.c; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col })
      if (!ncpWorksheet[cellAddress]) continue

      // Ensure cell is marked as string type
      ncpWorksheet[cellAddress].t = 's'
      ncpWorksheet[cellAddress].s = { ...headerStyle }
    }

    // Style content rows (row 1 and below) with alternating colors
    for (let row = 1; row <= headerRange.e.r; row++) {
      for (let col = headerRange.s.c; col <= headerRange.e.c; col++) {
        const cellAddress = XLSX.utils.encode_cell({ r: row, c: col })
        if (!ncpWorksheet[cellAddress]) continue

        // Ensure cell is marked as string type for proper text wrapping
        ncpWorksheet[cellAddress].t = 's'

        // Create style with alternating background colors
        const cellStyle = {
          ...contentStyle,
          fill: {
            fgColor: { rgb: col % 2 === 0 ? 'FFF7FAFC' : 'FFFFFFFF' },
          },
        }

        ncpWorksheet[cellAddress].s = cellStyle
      }
    }

    // Calculate and set row heights more precisely
    const rowHeights = []
    for (let i = 0; i <= headerRange.e.r; i++) {
      if (i === 0) {
        // Header row height
        rowHeights.push({ hpx: 50 })
      } else {
        // Calculate height based on content with better estimation
        const rowContent = Object.values(ncpData).map(value =>
          processTextForExcel(value)
        )

        // Calculate the maximum lines needed for any cell in this row
        const maxLines = Math.max(
          ...rowContent.map(content => {
            // Count explicit line breaks
            const explicitLines = (content.match(/\n/g) || []).length + 1

            // Estimate wrapped lines (40 characters per line for 40-width column)
            const estimatedWrappedLines = Math.ceil(content.length / 40)

            // Use the maximum of explicit lines and estimated wrapped lines
            return Math.max(explicitLines, estimatedWrappedLines)
          })
        )

        // Set row height: 18px per line with minimum of 100px and maximum of 400px
        const calculatedHeight = Math.max(100, Math.min(400, maxLines * 18))
        rowHeights.push({ hpx: calculatedHeight })
      }
    }
    ncpWorksheet['!rows'] = rowHeights

    // Add worksheet-level settings to force proper display
    if (!ncpWorksheet['!ws']) ncpWorksheet['!ws'] = {}
    ncpWorksheet['!ws']['!views'] = [
      {
        showGridLines: true,
        showRowColHeaders: true,
        showZeros: true,
        rightToLeft: false,
        tabSelected: true,
        showRuler: true,
        showOutlineSymbols: true,
        defaultGridColor: true,
        view: 'normal',
        topLeftCell: 'A1',
      },
    ]

    // Set print settings for landscape orientation
    ncpWorksheet['!margins'] = {
      left: 0.7,
      right: 0.7,
      top: 0.75,
      bottom: 0.75,
      header: 0.3,
      footer: 0.3,
    }

    ncpWorksheet['!printSettings'] = {
      orientation: 'landscape',
      scale: 100,
      fitToWidth: 1,
      fitToHeight: 0,
      paperSize: 1, // Letter size
      blackAndWhite: false,
      draft: false,
      cellComments: 'None',
      useFirstPageNumber: true,
      horizontalDpi: 300,
      verticalDpi: 300,
      copies: 1,
    }

    // Add the NCP sheet to workbook with custom title
    const sheetName = is_modified
      ? ncpTitle.length > 26
        ? 'NCP (Modified)'
        : `${ncpTitle} (Modified)`
      : ncpTitle.length > 31
        ? 'Nursing Care Plan'
        : ncpTitle

    XLSX.utils.book_append_sheet(workbook, ncpWorksheet, sheetName)

    // Update metadata to include the custom title and modification status
    const date = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })

    const metadataData = [
      ['Document Information', ''],
      ['Title', ncpTitle],
      ['Status', is_modified ? 'Modified by User' : 'Original AI-Generated'],
      ['Generated on', date],
      ['Generator', 'SmartCare'],
      ['', ''],
      ['Creator Information', ''],
      ['Created by', userDetails.full_name],
      ['Role', userDetails.role],
      ['Organization', userDetails.organization],
      ['', ''],
      ['Notes', ''],
      [
        'AI-Generated Content',
        'This nursing care plan was generated using AI and should be reviewed by qualified healthcare professionals.',
      ],
      ['Reference', 'Based on NANDA-I, NIC, and NOC standards'],
      [
        'Disclaimer',
        'Users should verify and modify the plan based on current patient assessment and clinical standards.',
      ],
    ]

    // Add modification notice if applicable
    if (is_modified) {
      metadataData.splice(11, 0, [
        'Modification Notice',
        'This NCP has been modified from its original AI-generated version. Please review all modifications for clinical accuracy.',
      ])
    }

    const metadataWorksheet = XLSX.utils.aoa_to_sheet(metadataData)

    // Set metadata column widths
    metadataWorksheet['!cols'] = [{ wch: 25 }, { wch: 65 }]

    // Style metadata sheet with proper formatting
    const metadataRange = XLSX.utils.decode_range(metadataWorksheet['!ref'])
    const sectionHeaderCells = ['A1', 'A6', 'A11']

    // Add modification notice styling if present
    if (is_modified) {
      sectionHeaderCells.push('A12')
    }

    for (let row = 0; row <= metadataRange.e.r; row++) {
      for (let col = 0; col <= metadataRange.e.c; col++) {
        const cellAddress = XLSX.utils.encode_cell({ r: row, c: col })
        if (!metadataWorksheet[cellAddress]) continue

        // Mark as string type
        metadataWorksheet[cellAddress].t = 's'

        if (sectionHeaderCells.includes(cellAddress)) {
          // Section header styling
          metadataWorksheet[cellAddress].s = {
            font: {
              bold: true,
              sz: 12,
              color: { rgb: 'FF2D3748' },
              name: 'Calibri',
            },
            fill: {
              fgColor: { rgb: 'FFE2E8F0' },
            },
            alignment: {
              vertical: 'center',
              horizontal: 'left',
              wrapText: true,
            },
          }
        } else if (is_modified && cellAddress === 'A3') {
          // Special styling for modification status
          metadataWorksheet[cellAddress].s = {
            font: {
              bold: true,
              sz: 10,
              color: { rgb: 'FFD97706' },
              name: 'Calibri',
            },
            alignment: {
              vertical: 'center',
              horizontal: 'left',
              wrapText: true,
            },
          }
        } else if (is_modified && cellAddress === 'B3') {
          // Special styling for modification status value
          metadataWorksheet[cellAddress].s = {
            font: {
              bold: true,
              sz: 10,
              color: { rgb: 'FFD97706' },
              name: 'Calibri',
            },
            fill: {
              fgColor: { rgb: 'FFFEF3C7' },
            },
            alignment: {
              vertical: 'center',
              horizontal: 'left',
              wrapText: true,
            },
          }
        } else {
          // Regular content styling
          metadataWorksheet[cellAddress].s = {
            alignment: {
              vertical: 'top',
              horizontal: 'left',
              wrapText: true,
            },
            font: {
              sz: 10,
              name: 'Calibri',
              color: { rgb: 'FF000000' },
            },
          }
        }
      }
    }

    // Set row heights for metadata based on content
    const metadataRowHeights = metadataData.map((row, index) => {
      if (sectionHeaderCells.some(cell => cell.startsWith(`A${index + 1}`))) {
        return { hpx: 35 } // Section headers
      }

      // Calculate height based on content length for long text
      const maxContentLength = Math.max(
        ...row.map(cell => (cell || '').toString().length)
      )
      if (maxContentLength > 50) {
        const lines = Math.ceil(maxContentLength / 60) // 60 chars per line in metadata
        return { hpx: Math.max(30, Math.min(120, lines * 20)) }
      }

      return { hpx: 25 } // Default height
    })

    metadataWorksheet['!rows'] = metadataRowHeights

    // Add metadata sheet to workbook
    XLSX.utils.book_append_sheet(workbook, metadataWorksheet, 'Document Info')

    // Write file with custom filename
    const filename = is_modified
      ? `${ncpTitle.toLowerCase().replace(/\s+/g, '-')}-modified.xlsx`
      : `${ncpTitle.toLowerCase().replace(/\s+/g, '-')}.xlsx`

    XLSX.writeFile(workbook, filename, {
      bookType: 'xlsx',
      type: 'binary',
      cellStyles: true,
      compression: true,
      Props: {
        Title: ncpTitle,
        Subject: is_modified
          ? 'AI-Generated Nursing Care Plan (Modified by User)'
          : 'AI-Generated Nursing Care Plan',
        Author: userDetails.full_name,
        CreatedDate: new Date(),
      },
    })
  },
}
