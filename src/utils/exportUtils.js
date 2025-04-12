import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

export const exportUtils = {
  async toPDF(ncp) {
    const doc = new jsPDF()
    const content = Object.entries(ncp)
      .map(([key, value]) => `${key.toUpperCase()}:\n${value}\n\n`)
      .join('')

    doc.text(content, 10, 10)
    doc.save('nursing-care-plan.pdf')
  },

  toCSV(ncp) {
    const csvContent = Object.entries(ncp)
      .map(([key, value]) => `"${key}","${value.replace(/\n/g, ' ')}"`)
      .join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = 'nursing-care-plan.csv'
    link.click()
  },

  toWord(ncp) {
    const content = Object.entries(ncp)
      .map(([key, value]) => `<h2>${key.toUpperCase()}</h2><p>${value}</p>`)
      .join('')

    const blob = new Blob(
      [`<html><body>${content}</body></html>`],
      { type: 'application/msword' }
    )
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = 'nursing-care-plan.doc'
    link.click()
  },

  async toPNG(ncp) {
    const container = document.createElement('div')
    container.style.padding = '20px'
    container.style.background = 'white'
    container.style.width = '800px'
    container.innerHTML = Object.entries(ncp)
      .map(([key, value]) => `<h2>${key.toUpperCase()}</h2><p>${value}</p>`)
      .join('')

    document.body.appendChild(container)
    const canvas = await html2canvas(container)
    document.body.removeChild(container)

    const link = document.createElement('a')
    link.href = canvas.toDataURL('image/png')
    link.download = 'nursing-care-plan.png'
    link.click()
  },
}
