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

    // Create two-tier header structure
    const createTwoTierHeaders = columnLabels => {
      // Map column labels to their keys
      const labelToKey = {
        Assessment: 'assessment',
        Diagnosis: 'diagnosis',
        Objectives: 'outcomes',
        Interventions: 'interventions',
        Rationale: 'rationale',
        Implementation: 'implementation',
        Evaluation: 'evaluation',
      }

      const columnKeys = columnLabels.map(
        label => labelToKey[label] || label.toLowerCase()
      )

      // First row: Main section headers with colspan
      const firstRow = []
      let i = 0
      while (i < columnKeys.length) {
        const key = columnKeys[i]
        if (key === 'assessment') {
          firstRow.push({
            content: 'Assessment',
            colSpan: 1,
            rowSpan: 2,
            styles: { halign: 'center', valign: 'middle' },
          })
          i++
        } else if (key === 'diagnosis') {
          firstRow.push({
            content: 'Diagnosis',
            colSpan: 1,
            rowSpan: 2,
            styles: { halign: 'center', valign: 'middle' },
          })
          i++
        } else if (
          key === 'outcomes' ||
          key === 'interventions' ||
          key === 'rationale'
        ) {
          // Count planning columns
          let planningCount = 0
          let tempI = i
          while (
            tempI < columnKeys.length &&
            ['outcomes', 'interventions', 'rationale'].includes(
              columnKeys[tempI]
            )
          ) {
            planningCount++
            tempI++
          }
          firstRow.push({
            content: 'Planning',
            colSpan: planningCount,
            styles: { halign: 'center' },
          })
          i = tempI
        } else if (key === 'implementation') {
          firstRow.push({
            content: 'Implementation',
            colSpan: 1,
            rowSpan: 2,
            styles: { halign: 'center', valign: 'middle' },
          })
          i++
        } else if (key === 'evaluation') {
          firstRow.push({
            content: 'Evaluation',
            colSpan: 1,
            rowSpan: 2,
            styles: { halign: 'center', valign: 'middle' },
          })
          i++
        } else {
          firstRow.push({
            content: columnLabels[i],
            colSpan: 1,
            rowSpan: 2,
            styles: { halign: 'center', valign: 'middle' },
          })
          i++
        }
      }

      // Second row: Individual column headers (only for Planning columns)
      const secondRow = columnKeys
        .map((key, idx) => {
          if (['outcomes', 'interventions', 'rationale'].includes(key)) {
            return { content: columnLabels[idx], styles: { halign: 'center' } }
          }
          return null // These cells are covered by rowSpan in first row
        })
        .filter(cell => cell !== null)

      return [firstRow, secondRow]
    }

    const headers = createTwoTierHeaders(columns)

    // Create table with enhanced styling matching Word export
    autoTable(doc, {
      head: headers,
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

    // Helper function to create two-tier headers for Excel
    const createExcelTwoTierHeaders = columnLabels => {
      const labelToKey = {
        Assessment: 'assessment',
        Diagnosis: 'diagnosis',
        Objectives: 'outcomes',
        Interventions: 'interventions',
        Rationale: 'rationale',
        Implementation: 'implementation',
        Evaluation: 'evaluation',
      }

      const columnKeys = columnLabels.map(
        label => labelToKey[label] || label.toLowerCase()
      )

      // First row: Main section headers
      const firstRow = []
      const merges = []
      let colIndex = 0
      let i = 0

      while (i < columnKeys.length) {
        const key = columnKeys[i]
        if (key === 'assessment') {
          firstRow.push('Assessment')
          // Mark for merge (row 0-1, col colIndex)
          merges.push({ s: { r: 0, c: colIndex }, e: { r: 1, c: colIndex } })
          colIndex++
          i++
        } else if (key === 'diagnosis') {
          firstRow.push('Diagnosis')
          merges.push({ s: { r: 0, c: colIndex }, e: { r: 1, c: colIndex } })
          colIndex++
          i++
        } else if (
          key === 'outcomes' ||
          key === 'interventions' ||
          key === 'rationale'
        ) {
          let planningCount = 0
          let tempI = i
          while (
            tempI < columnKeys.length &&
            ['outcomes', 'interventions', 'rationale'].includes(
              columnKeys[tempI]
            )
          ) {
            planningCount++
            tempI++
          }
          firstRow.push('Planning')
          // Merge across planning columns
          for (let j = 1; j < planningCount; j++) {
            firstRow.push('')
          }
          if (planningCount > 1) {
            merges.push({
              s: { r: 0, c: colIndex },
              e: { r: 0, c: colIndex + planningCount - 1 },
            })
          }
          colIndex += planningCount
          i = tempI
        } else if (key === 'implementation') {
          firstRow.push('Implementation')
          merges.push({ s: { r: 0, c: colIndex }, e: { r: 1, c: colIndex } })
          colIndex++
          i++
        } else if (key === 'evaluation') {
          firstRow.push('Evaluation')
          merges.push({ s: { r: 0, c: colIndex }, e: { r: 1, c: colIndex } })
          colIndex++
          i++
        } else {
          firstRow.push(columnLabels[i])
          merges.push({ s: { r: 0, c: colIndex }, e: { r: 1, c: colIndex } })
          colIndex++
          i++
        }
      }

      // Second row: Individual column headers (fill in for Planning columns, empty for merged cells)
      const secondRow = columnKeys.map(key => {
        if (['outcomes', 'interventions', 'rationale'].includes(key)) {
          return columnLabels[columnKeys.indexOf(key)]
        }
        return '' // Empty for merged cells
      })

      return { firstRow, secondRow, merges }
    }

    const { firstRow, secondRow, merges } = createExcelTwoTierHeaders(columns)

    const ncpWorksheetData = [
      firstRow,
      secondRow,
      Object.values(ncpData).map(value => processTextForExcel(value)),
    ]

    const ncpWorksheet = XLSX.utils.aoa_to_sheet(ncpWorksheetData)

    // Apply merges
    ncpWorksheet['!merges'] = merges

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

    // Style header rows (row 0 and row 1)
    for (let row = 0; row <= 1; row++) {
      for (let col = headerRange.s.c; col <= headerRange.e.c; col++) {
        const cellAddress = XLSX.utils.encode_cell({ r: row, c: col })
        if (!ncpWorksheet[cellAddress]) continue

        // Ensure cell is marked as string type
        ncpWorksheet[cellAddress].t = 's'
        ncpWorksheet[cellAddress].s = { ...headerStyle }
      }
    }

    // Style content rows (row 2 and below) with alternating colors
    for (let row = 2; row <= headerRange.e.r; row++) {
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
      if (i === 0 || i === 1) {
        // Header row heights
        rowHeights.push({ hpx: 40 })
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

  /**
   * Enhanced PNG export using html2canvas with improved styling and rendering
   */
  async toPNGEnhanced(ncp, columnLabels = null, isFormatted = false) {
    try {
      // Get user details for accountability
      const userDetails = await userService.getUserProfile()

      // Extract title for filename
      const { title } = ncp
      const ncpTitle = title || 'Nursing Care Plan'

      // Create a temporary DOM element for rendering
      const tempContainer = document.createElement('div')
      tempContainer.style.position = 'absolute'
      tempContainer.style.left = '0'
      tempContainer.style.top = '0'
      tempContainer.style.width = '1200px'
      tempContainer.style.minHeight = '600px'
      tempContainer.style.backgroundColor = '#ffffff'
      tempContainer.style.color = '#000000'
      tempContainer.style.padding = '20px'
      tempContainer.style.fontFamily =
        "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
      tempContainer.style.fontSize = '14px'
      tempContainer.style.lineHeight = '1.6'
      tempContainer.style.visibility = 'hidden'
      tempContainer.style.pointerEvents = 'none'
      tempContainer.style.zIndex = '99999'

      // Generate enhanced HTML content with simpler styling for better html2canvas compatibility
      tempContainer.innerHTML = this.generateSimpleHTML(
        ncp,
        columnLabels,
        isFormatted,
        userDetails
      )

      document.body.appendChild(tempContainer)

      // Wait for content to render and fonts to load
      await new Promise(resolve => setTimeout(resolve, 500))

      // Make visible for capture
      tempContainer.style.visibility = 'visible'

      // Take screenshot with html2canvas with simpler, more reliable options
      const canvas = await html2canvas(tempContainer, {
        backgroundColor: '#ffffff',
        scale: 1, // Use scale 1 first to ensure it works
        useCORS: true,
        allowTaint: false,
        foreignObjectRendering: false, // Disable for better compatibility
        logging: true, // Enable logging to debug issues
        width: 1240, // Container width + padding
        height: tempContainer.scrollHeight + 40,
        scrollX: 0,
        scrollY: 0,
        removeContainer: false,
      })

      // Clean up
      document.body.removeChild(tempContainer)

      // Debug: Check if canvas has content
      if (canvas.width === 0 || canvas.height === 0) {
        throw new Error('Canvas has zero dimensions')
      }

      // Convert canvas to blob and download
      canvas.toBlob(
        blob => {
          if (!blob) {
            throw new Error('Failed to create blob from canvas')
          }

          const url = URL.createObjectURL(blob)
          const link = document.createElement('a')
          link.href = url
          link.download = `${ncpTitle.toLowerCase().replace(/\s+/g, '-')}.png`
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
          URL.revokeObjectURL(url)
        },
        'image/png',
        1.0
      )
    } catch (error) {
      console.error('Enhanced PNG export failed:', error)

      // Fallback to original PNG method
      console.log('Falling back to original PNG method...')
      return this.toPNG(ncp, columnLabels, isFormatted)
    }
  },

  /**
   * Enhanced Word export using proper DOCX generation
   */
  async toWordEnhanced(ncp, columnLabels = null, isFormatted = false) {
    try {
      const {
        Document,
        Packer,
        Paragraph,
        Table,
        TableCell,
        TableRow,
        TextRun,
        WidthType,
        AlignmentType,
        HeadingLevel,
        VerticalAlign,
      } = await import('docx')

      // Get user details for accountability
      const userDetails = await userService.getUserProfile()

      // Extract title and modification status
      const { title, is_modified, ...ncpData } = ncp
      const ncpTitle = title || 'Nursing Care Plan'

      const columns =
        columnLabels ||
        Object.keys(ncpData).map(
          key => key.charAt(0).toUpperCase() + key.slice(1)
        )

      // Process text for better formatting in Word
      const processTextForWord = data => {
        if (isFormatted && Array.isArray(data)) {
          return data
            .map(line => line.trim())
            .filter(line => line.length > 0)
            .join('\n')
        } else {
          if (!data) return ''
          return data
            .split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 0)
            .join('\n')
        }
      }

      // Create document header
      const headerParagraphs = [
        new Paragraph({
          children: [
            new TextRun({
              text: ncpTitle,
              bold: true,
              size: 32,
              color: '2d3748',
            }),
          ],
          alignment: AlignmentType.CENTER,
          heading: HeadingLevel.HEADING_1,
        }),
      ]

      if (is_modified) {
        headerParagraphs.push(
          new Paragraph({
            children: [
              new TextRun({
                text: '(Modified by User)',
                italics: true,
                size: 20,
                color: 'd97706',
              }),
            ],
            alignment: AlignmentType.CENTER,
          })
        )
      }

      // Helper function to create two-tier header for Word
      const createWordTwoTierHeaders = columnLabels => {
        // Map column labels to their keys
        const labelToKey = {
          Assessment: 'assessment',
          Diagnosis: 'diagnosis',
          Objectives: 'outcomes',
          Interventions: 'interventions',
          Rationale: 'rationale',
          Implementation: 'implementation',
          Evaluation: 'evaluation',
        }

        const columnKeys = columnLabels.map(
          label => labelToKey[label] || label.toLowerCase()
        )

        // First row: Main section headers
        const firstRowCells = []
        let i = 0
        while (i < columnKeys.length) {
          const key = columnKeys[i]
          if (key === 'assessment') {
            firstRowCells.push(
              new TableCell({
                children: [
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: 'Assessment',
                        bold: true,
                        color: 'ffffff',
                      }),
                    ],
                    alignment: AlignmentType.CENTER,
                  }),
                ],
                shading: { fill: '1e293b' },
                rowSpan: 2,
                verticalAlign: VerticalAlign.CENTER,
              })
            )
            i++
          } else if (key === 'diagnosis') {
            firstRowCells.push(
              new TableCell({
                children: [
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: 'Diagnosis',
                        bold: true,
                        color: 'ffffff',
                      }),
                    ],
                    alignment: AlignmentType.CENTER,
                  }),
                ],
                shading: { fill: '1e293b' },
                rowSpan: 2,
                verticalAlign: VerticalAlign.CENTER,
              })
            )
            i++
          } else if (
            key === 'outcomes' ||
            key === 'interventions' ||
            key === 'rationale'
          ) {
            // Count planning columns
            let planningCount = 0
            let tempI = i
            while (
              tempI < columnKeys.length &&
              ['outcomes', 'interventions', 'rationale'].includes(
                columnKeys[tempI]
              )
            ) {
              planningCount++
              tempI++
            }
            firstRowCells.push(
              new TableCell({
                children: [
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: 'Planning',
                        bold: true,
                        color: 'ffffff',
                      }),
                    ],
                    alignment: AlignmentType.CENTER,
                  }),
                ],
                shading: { fill: '1e293b' },
                columnSpan: planningCount,
              })
            )
            i = tempI
          } else if (key === 'implementation') {
            firstRowCells.push(
              new TableCell({
                children: [
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: 'Implementation',
                        bold: true,
                        color: 'ffffff',
                      }),
                    ],
                    alignment: AlignmentType.CENTER,
                  }),
                ],
                shading: { fill: '1e293b' },
                rowSpan: 2,
                verticalAlign: VerticalAlign.CENTER,
              })
            )
            i++
          } else if (key === 'evaluation') {
            firstRowCells.push(
              new TableCell({
                children: [
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: 'Evaluation',
                        bold: true,
                        color: 'ffffff',
                      }),
                    ],
                    alignment: AlignmentType.CENTER,
                  }),
                ],
                shading: { fill: '1e293b' },
                rowSpan: 2,
                verticalAlign: VerticalAlign.CENTER,
              })
            )
            i++
          } else {
            firstRowCells.push(
              new TableCell({
                children: [
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: columnLabels[i],
                        bold: true,
                        color: 'ffffff',
                      }),
                    ],
                    alignment: AlignmentType.CENTER,
                  }),
                ],
                shading: { fill: '1e293b' },
                rowSpan: 2,
                verticalAlign: VerticalAlign.CENTER,
              })
            )
            i++
          }
        }

        // Second row: Individual column headers (only for Planning columns)
        const secondRowCells = columnKeys
          .map((key, idx) => {
            if (['outcomes', 'interventions', 'rationale'].includes(key)) {
              return new TableCell({
                children: [
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: columnLabels[idx],
                        bold: true,
                        color: 'ffffff',
                      }),
                    ],
                    alignment: AlignmentType.CENTER,
                  }),
                ],
                shading: { fill: '1e293b' },
              })
            }
            return null
          })
          .filter(cell => cell !== null)

        return [
          new TableRow({ children: firstRowCells }),
          new TableRow({ children: secondRowCells }),
        ]
      }

      // Create table rows
      const headerRows = createWordTwoTierHeaders(columns)
      const tableRows = [
        ...headerRows,
        // Data row
        new TableRow({
          children: Object.values(ncpData).map(
            value =>
              new TableCell({
                children: [
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: processTextForWord(value),
                      }),
                    ],
                  }),
                ],
              })
          ),
        }),
      ]

      // Create the table
      const table = new Table({
        rows: tableRows,
        width: {
          size: 100,
          type: WidthType.PERCENTAGE,
        },
      })

      // Create footer
      const footerParagraphs = [
        new Paragraph({
          children: [
            new TextRun({
              text: `Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`,
              size: 18,
              color: '64748b',
            }),
          ],
        }),
      ]

      if (userDetails?.email) {
        footerParagraphs.push(
          new Paragraph({
            children: [
              new TextRun({
                text: `Generated by: ${userDetails.email}`,
                size: 18,
                color: '64748b',
              }),
            ],
          })
        )
      }

      footerParagraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: 'SmartCare NCP Generator - Professional Nursing Care Plan System',
              bold: true,
              size: 18,
              color: '4a5568',
            }),
          ],
        })
      )

      // Create document
      const doc = new Document({
        sections: [
          {
            children: [
              ...headerParagraphs,
              new Paragraph({ text: '' }), // spacing
              table,
              new Paragraph({ text: '' }), // spacing
              ...footerParagraphs,
            ],
          },
        ],
      })

      // Generate and download
      const buffer = await Packer.toBuffer(doc)
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${ncpTitle.toLowerCase().replace(/\s+/g, '-')}.docx`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Enhanced Word export failed:', error)

      // Fallback to original Word method
      console.log('Falling back to original Word method...')
      return this.toWord(ncp, columnLabels, isFormatted)
    }
  },

  /**
   * Generate enhanced HTML for better rendering
   */
  generateEnhancedHTML(ncp, columnLabels, isFormatted, userDetails) {
    const { title, is_modified, ...ncpData } = ncp
    const ncpTitle = title || 'Nursing Care Plan'

    const columns =
      columnLabels ||
      Object.keys(ncpData).map(
        key => key.charAt(0).toUpperCase() + key.slice(1)
      )

    // Process text for better formatting
    const processText = data => {
      if (isFormatted && Array.isArray(data)) {
        return data
          .map(line => line.trim())
          .filter(line => line.length > 0)
          .map(line => {
            // Handle numbered lists
            if (line.match(/^\d+\./)) {
              return `<div style="margin-bottom: 6px; padding-left: 8px; line-height: 1.5;">${line}</div>`
            }
            // Handle bullet points
            if (line.startsWith('-')) {
              return `<div style="margin-bottom: 6px; padding-left: 12px; line-height: 1.5;">${line}</div>`
            }
            // Regular text
            return `<div style="margin-bottom: 8px; line-height: 1.5;">${line}</div>`
          })
          .join('')
      } else {
        if (!data) return ''
        return data
          .split('\n')
          .map(line => line.trim())
          .filter(line => line.length > 0)
          .map(
            line =>
              `<div style="margin-bottom: 8px; line-height: 1.5;">${line}</div>`
          )
          .join('')
      }
    }

    // Generate table rows
    const tableData = Object.values(ncpData).map(value => processText(value))

    return `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: white; color: #1e293b; line-height: 1.6; max-width: 100%; margin: 0 auto;">
        <div style="text-align: center; margin-bottom: 30px; border-bottom: 3px solid #4299e1; padding-bottom: 20px;">
          <h1 style="font-size: 24px; font-weight: bold; color: #2d3748; margin-bottom: 8px; margin-top: 0;">${ncpTitle}</h1>
          ${is_modified ? '<div style="font-size: 12px; color: #d97706; font-style: italic; margin-bottom: 10px;">(Modified by User)</div>' : ''}
        </div>
        
        <table style="width: 100%; border-collapse: collapse; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); border-radius: 8px; overflow: hidden;">
          <thead>
            <tr>
              ${columns.map(col => `<th style="background: linear-gradient(135deg, #1e293b 0%, #334155 100%); color: #f8fafc; padding: 16px 12px; text-align: left; font-weight: 600; font-size: 14px; border: none;">${col}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            <tr>
              ${tableData.map((data, index) => `<td style="padding: 16px 12px; border: 1px solid #e2e8f0; vertical-align: top; background: ${index % 2 === 0 ? 'white' : '#f8fafc'};">${data}</td>`).join('')}
            </tr>
          </tbody>
        </table>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b;">
          <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap;">
            <div>Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</div>
            ${userDetails?.email ? `<div>Generated by: ${userDetails.email}</div>` : ''}
          </div>
          <div style="margin-top: 10px; font-weight: 600;">
            SmartCare NCP Generator - Professional Nursing Care Plan System
          </div>
        </div>
      </div>
    `
  },

  /**
   * Generate simple HTML for PNG exports (html2canvas compatible)
   */
  generateSimpleHTML(ncp, columnLabels, isFormatted, userDetails) {
    const { title, is_modified, ...ncpData } = ncp
    const ncpTitle = title || 'Nursing Care Plan'

    const columns =
      columnLabels ||
      Object.keys(ncpData).map(
        key => key.charAt(0).toUpperCase() + key.slice(1)
      )

    // Process text for better formatting
    const processText = data => {
      if (isFormatted && Array.isArray(data)) {
        return data
          .map(line => line.trim())
          .filter(line => line.length > 0)
          .map(line => {
            // Handle numbered lists
            if (line.match(/^\d+\./)) {
              return `<div style="margin-bottom: 6px; padding-left: 8px; line-height: 1.5; color: #1e293b;">${line}</div>`
            }
            // Handle bullet points
            if (line.startsWith('-')) {
              return `<div style="margin-bottom: 6px; padding-left: 12px; line-height: 1.5; color: #1e293b;">${line}</div>`
            }
            // Regular text
            return `<div style="margin-bottom: 8px; line-height: 1.5; color: #1e293b;">${line}</div>`
          })
          .join('')
      } else {
        if (!data) return ''
        return data
          .split('\n')
          .map(line => line.trim())
          .filter(line => line.length > 0)
          .map(
            line =>
              `<div style="margin-bottom: 8px; line-height: 1.5; color: #1e293b;">${line}</div>`
          )
          .join('')
      }
    }

    // Helper function to create two-tier headers for HTML
    const createHTMLTwoTierHeaders = columnLabels => {
      const labelToKey = {
        Assessment: 'assessment',
        Diagnosis: 'diagnosis',
        Objectives: 'outcomes',
        Interventions: 'interventions',
        Rationale: 'rationale',
        Implementation: 'implementation',
        Evaluation: 'evaluation',
      }

      const columnKeys = columnLabels.map(
        label => labelToKey[label] || label.toLowerCase()
      )

      // First row: Main section headers
      let firstRow = ''
      let i = 0
      while (i < columnKeys.length) {
        const key = columnKeys[i]
        if (key === 'assessment') {
          firstRow += `<th rowspan="2" style="background-color: #1e293b; color: #ffffff; padding: 16px 12px; text-align: center; font-weight: bold; font-size: 14px; border: 1px solid #1e293b; font-family: Arial, sans-serif; vertical-align: middle;">Assessment</th>`
          i++
        } else if (key === 'diagnosis') {
          firstRow += `<th rowspan="2" style="background-color: #1e293b; color: #ffffff; padding: 16px 12px; text-align: center; font-weight: bold; font-size: 14px; border: 1px solid #1e293b; font-family: Arial, sans-serif; vertical-align: middle;">Diagnosis</th>`
          i++
        } else if (
          key === 'outcomes' ||
          key === 'interventions' ||
          key === 'rationale'
        ) {
          let planningCount = 0
          let tempI = i
          while (
            tempI < columnKeys.length &&
            ['outcomes', 'interventions', 'rationale'].includes(
              columnKeys[tempI]
            )
          ) {
            planningCount++
            tempI++
          }
          firstRow += `<th colspan="${planningCount}" style="background-color: #1e293b; color: #ffffff; padding: 16px 12px; text-align: center; font-weight: bold; font-size: 14px; border: 1px solid #1e293b; font-family: Arial, sans-serif;">Planning</th>`
          i = tempI
        } else if (key === 'implementation') {
          firstRow += `<th rowspan="2" style="background-color: #1e293b; color: #ffffff; padding: 16px 12px; text-align: center; font-weight: bold; font-size: 14px; border: 1px solid #1e293b; font-family: Arial, sans-serif; vertical-align: middle;">Implementation</th>`
          i++
        } else if (key === 'evaluation') {
          firstRow += `<th rowspan="2" style="background-color: #1e293b; color: #ffffff; padding: 16px 12px; text-align: center; font-weight: bold; font-size: 14px; border: 1px solid #1e293b; font-family: Arial, sans-serif; vertical-align: middle;">Evaluation</th>`
          i++
        } else {
          firstRow += `<th rowspan="2" style="background-color: #1e293b; color: #ffffff; padding: 16px 12px; text-align: center; font-weight: bold; font-size: 14px; border: 1px solid #1e293b; font-family: Arial, sans-serif; vertical-align: middle;">${columnLabels[i]}</th>`
          i++
        }
      }

      // Second row: Individual column headers (only for Planning columns)
      let secondRow = ''
      columnKeys.forEach((key, idx) => {
        if (['outcomes', 'interventions', 'rationale'].includes(key)) {
          secondRow += `<th style="background-color: #1e293b; color: #ffffff; padding: 16px 12px; text-align: center; font-weight: bold; font-size: 14px; border: 1px solid #1e293b; font-family: Arial, sans-serif;">${columnLabels[idx]}</th>`
        }
      })

      return `<tr>${firstRow}</tr><tr>${secondRow}</tr>`
    }

    // Generate table rows
    const tableData = Object.values(ncpData).map(value => processText(value))

    return `
      <div style="font-family: Arial, sans-serif; background-color: #ffffff; color: #1e293b; line-height: 1.6; padding: 20px; width: 1160px;">
        <div style="text-align: center; margin-bottom: 30px; border-bottom: 3px solid #4299e1; padding-bottom: 20px;">
          <h1 style="font-size: 24px; font-weight: bold; color: #2d3748; margin: 0 0 8px 0; font-family: Arial, sans-serif;">${ncpTitle}</h1>
          ${is_modified ? '<div style="font-size: 12px; color: #d97706; font-style: italic; margin-bottom: 10px; font-family: Arial, sans-serif;">(Modified by User)</div>' : ''}
        </div>
        
        <table style="width: 100%; border-collapse: collapse; border: 2px solid #1e293b;">
          <thead>
            ${createHTMLTwoTierHeaders(columns)}
          </thead>
          <tbody>
            <tr>
              ${tableData.map((data, index) => `<td style="padding: 16px 12px; border: 1px solid #e2e8f0; vertical-align: top; background-color: ${index % 2 === 0 ? '#ffffff' : '#f8fafc'}; font-family: Arial, sans-serif; color: #1e293b;">${data}</td>`).join('')}
            </tr>
          </tbody>
        </table>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b; font-family: Arial, sans-serif;">
          <div style="margin-bottom: 10px;">
            <span>Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</span>
            ${userDetails?.email ? `<span style="margin-left: 20px;">Generated by: ${userDetails.email}</span>` : ''}
          </div>
          <div style="font-weight: bold; color: #4a5568;">
            SmartCare NCP Generator - Professional Nursing Care Plan System
          </div>
        </div>
      </div>
    `
  },

  /**
   * Exports nursing assessment form data as a formatted PDF
   * @param {Object} formValues - The form values from the assessment form
   * @returns {Promise<void>}
   */
  async exportAssessmentToPDF(formValues) {
    // Get user details for accountability
    const userDetails = await userService.getUserProfile()

    // Create PDF document (portrait orientation for reading)
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'pt',
      format: 'letter',
    })

    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()
    const margin = 40
    const contentWidth = pageWidth - 2 * margin
    let yPosition = margin

    // Helper function to check if we need a new page
    const checkPageBreak = heightNeeded => {
      if (yPosition + heightNeeded > pageHeight - margin) {
        doc.addPage()
        yPosition = margin
        return true
      }
      return false
    }

    // Header
    doc.setFillColor(41, 98, 255) // Blue background
    doc.rect(0, 0, pageWidth, 100, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(24)
    doc.setFont('helvetica', 'bold')
    doc.text('NURSING ASSESSMENT FORM', pageWidth / 2, 35, { align: 'center' })
    doc.setFontSize(12)
    doc.setFont('helvetica', 'normal')
    doc.text('Personal Reference Copy', pageWidth / 2, 55, { align: 'center' })

    // Export date and user info
    doc.setFontSize(9)
    doc.text(`Exported: ${new Date().toLocaleString()}`, pageWidth / 2, 72, {
      align: 'center',
    })

    // User details
    if (userDetails) {
      doc.setFontSize(8)
      doc.text(
        `Prepared by: ${userDetails.full_name} | ${userDetails.role} | ${userDetails.organization}`,
        pageWidth / 2,
        87,
        { align: 'center' }
      )
    }

    yPosition = 120
    doc.setTextColor(0, 0, 0)

    // Helper function to add a section header
    const addSectionHeader = title => {
      checkPageBreak(40)
      yPosition += 10
      doc.setFillColor(240, 245, 255)
      doc.rect(margin, yPosition - 15, contentWidth, 25, 'F')
      doc.setTextColor(30, 64, 175)
      doc.setFontSize(14)
      doc.setFont('helvetica', 'bold')
      doc.text(title, margin + 10, yPosition)
      yPosition += 20
      doc.setTextColor(0, 0, 0)
    }

    // Helper function to add a field
    const addField = (label, value, isArray = false, isObject = false) => {
      checkPageBreak(25)
      doc.setFontSize(10)
      doc.setFont('helvetica', 'bold')
      doc.text(`${label}:`, margin + 10, yPosition)
      yPosition += 15

      doc.setFont('helvetica', 'normal')
      doc.setTextColor(60, 60, 60)

      if (isArray && Array.isArray(value)) {
        if (
          value.length === 0 ||
          (value.length === 1 && value[0] === 'None specified')
        ) {
          doc.text('• None specified', margin + 20, yPosition)
          yPosition += 15
        } else {
          value.forEach(item => {
            const lines = doc.splitTextToSize(`• ${item}`, contentWidth - 30)
            checkPageBreak(lines.length * 15)
            lines.forEach(line => {
              doc.text(line, margin + 20, yPosition)
              yPosition += 15
            })
          })
        }
      } else if (isObject && typeof value === 'object') {
        let hasContent = false
        for (const [key, val] of Object.entries(value)) {
          if (val && val !== 'Not specified') {
            hasContent = true
            const formattedKey = key
              .replace(/([A-Z])/g, ' $1')
              .replace(/^./, str => str.toUpperCase())
            const text = `  ${formattedKey}: ${val}`
            const lines = doc.splitTextToSize(text, contentWidth - 30)
            checkPageBreak(lines.length * 15)
            lines.forEach(line => {
              doc.text(line, margin + 20, yPosition)
              yPosition += 15
            })
          }
        }
        if (!hasContent) {
          doc.text('  No findings recorded', margin + 20, yPosition)
          yPosition += 15
        }
      } else {
        const displayValue = value || 'Not specified'
        const lines = doc.splitTextToSize(displayValue, contentWidth - 30)
        checkPageBreak(lines.length * 15)
        lines.forEach(line => {
          doc.text(line, margin + 20, yPosition)
          yPosition += 15
        })
      }

      doc.setTextColor(0, 0, 0)
      yPosition += 5
    }

    // PATIENT DEMOGRAPHICS
    addSectionHeader('PATIENT DEMOGRAPHICS')
    addField('Age', formValues.age || 'Not specified')
    addField('Sex', formValues.sex || 'Not specified')
    addField('Occupation', formValues.occupation || 'Not specified')
    addField('Religion', formValues.religion || 'Not specified')
    addField(
      'Cultural Background',
      formValues.cultural_background || 'Not specified'
    )
    addField('Language', formValues.language || 'Not specified')

    // CHIEF COMPLAINT
    addSectionHeader('CHIEF COMPLAINT')
    addField(
      'General Condition',
      formValues.general_condition || 'Not specified'
    )

    // HISTORY OF PRESENT ILLNESS
    addSectionHeader('HISTORY OF PRESENT ILLNESS')
    addField('Onset and Duration', formValues.onset_duration || 'Not specified')
    addField(
      'Severity and Progression',
      formValues.severity_progression || 'Not specified'
    )
    addField(
      'Medical Impression',
      formValues.medical_impression || 'Not specified'
    )
    addField(
      'Associated Symptoms',
      formValues.associated_symptoms?.length > 0
        ? formValues.associated_symptoms
        : ['None specified'],
      true
    )
    addField('Other Symptoms', formValues.other_symptoms || 'None')

    // RISK FACTORS
    addSectionHeader('RISK FACTORS')
    addField(
      'Risk Factors',
      formValues.risk_factors?.length > 0
        ? formValues.risk_factors
        : ['None specified'],
      true
    )
    addField('Other Risk Factors', formValues.other_risk_factors || 'None')

    // PAST MEDICAL HISTORY
    addSectionHeader('PAST MEDICAL HISTORY')
    addField(
      'Medical History',
      formValues.medical_history?.length > 0
        ? formValues.medical_history
        : ['None specified'],
      true
    )
    addField(
      'Other Medical History',
      formValues.other_medical_history || 'None'
    )

    // FAMILY HISTORY
    addSectionHeader('FAMILY HISTORY')
    addField(
      'Family History',
      formValues.family_history?.length > 0
        ? formValues.family_history
        : ['None specified'],
      true
    )
    addField('Other Family History', formValues.other_family_history || 'None')

    // VITAL SIGNS
    addSectionHeader('VITAL SIGNS')
    addField('Heart Rate (bpm)', formValues.heart_rate_bpm || 'Not recorded')
    addField(
      'Blood Pressure (mmHg)',
      formValues.blood_pressure_mmhg || 'Not recorded'
    )
    addField(
      'Respiratory Rate (per min)',
      formValues.respiratory_rate_min || 'Not recorded'
    )
    addField(
      'Oxygen Saturation (%)',
      formValues.oxygen_saturation_percent || 'Not recorded'
    )
    addField(
      'Temperature (°C)',
      formValues.temperature_celsius || 'Not recorded'
    )

    // PHYSICAL EXAMINATION
    addSectionHeader('PHYSICAL EXAMINATION')
    addField('Height', formValues.height || 'Not recorded')
    addField('Weight', formValues.weight || 'Not recorded')
    addField(
      'Cephalocaudal Assessment',
      formValues.cephalocaudal_assessment || {},
      false,
      true
    )

    // LABORATORY FINDINGS
    addSectionHeader('LABORATORY FINDINGS')
    addField(
      'Laboratory Results',
      formValues.laboratory_results || 'Not specified'
    )

    // SUBJECTIVE DATA
    addSectionHeader('SUBJECTIVE DATA')
    addField('Subjective Information', formValues.subjective || 'Not specified')

    // OBJECTIVE DATA
    addSectionHeader('OBJECTIVE DATA')
    addField('Objective Information', formValues.objective || 'Not specified')

    // Footer on last page
    yPosition = pageHeight - 60
    doc.setFontSize(8)
    doc.setTextColor(100, 100, 100)

    // User details in footer
    if (userDetails) {
      doc.text(
        `Prepared by: ${userDetails.full_name}`,
        pageWidth / 2,
        yPosition,
        { align: 'center' }
      )
      doc.text(
        `${userDetails.role} - ${userDetails.organization}`,
        pageWidth / 2,
        yPosition + 12,
        { align: 'center' }
      )
      yPosition += 24
    }

    doc.text(
      'This is a personal reference copy for educational purposes only.',
      pageWidth / 2,
      yPosition,
      { align: 'center' }
    )
    doc.text('SmartCare NCP Generator', pageWidth / 2, yPosition + 12, {
      align: 'center',
    })

    // Generate filename with timestamp
    const timestamp = new Date()
      .toISOString()
      .replace(/[:.]/g, '-')
      .slice(0, -5)
    const filename = `nursing-assessment-${timestamp}.pdf`

    // Save the PDF
    doc.save(filename)
  },
}
