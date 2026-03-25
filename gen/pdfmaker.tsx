import jsPDF from "jspdf"

type Block = {
  type: string
  text?: string
  points?: string[]
  items?: string[]
}

type AgentResponse = {
  type?: string
  blocks?: Block[]
  metadata?: Record<string, string>
}

export const exportResponsePDF = (content: string, index: number) => {
  const doc = new jsPDF({ unit: "mm", format: "a4" })
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const marginX = 18
  const contentWidth = pageWidth - marginX * 2
  let y = 0

  

  const initPage = () => {
    // Dark background
    doc.setFillColor(17, 17, 24)
    doc.rect(0, 0, pageWidth, pageHeight, "F")
    // Blue left accent stripe
    doc.setFillColor(56, 115, 255)
    doc.rect(0, 0, 3.5, pageHeight, "F")
  }

  const drawHeader = () => {
    doc.setFillColor(24, 24, 35)
    doc.rect(0, 0, pageWidth, 13, "F")
    doc.setFontSize(7.5)
    doc.setFont("helvetica", "normal")
    doc.setTextColor(100, 105, 130)
    doc.text("Socratic AI Teaching Assistant", marginX, 8.5)
    doc.text(new Date().toLocaleDateString("en-GB"), pageWidth - marginX, 8.5, { align: "right" })
  }

  const drawFooter = (pageNum: number, total: number) => {
    doc.setDrawColor(45, 48, 65)
    doc.setLineWidth(0.25)
    doc.line(marginX, pageHeight - 13, pageWidth - marginX, pageHeight - 13)
    doc.setFontSize(7)
    doc.setFont("helvetica", "normal")
    doc.setTextColor(80, 85, 110)
    doc.text(`Page ${pageNum} of ${total}`, pageWidth / 2, pageHeight - 7, { align: "center" })
  }

  const checkPageBreak = (needed = 8) => {
    if (y + needed > pageHeight - 18) {
      // Add new page and initialize
      doc.addPage()
      initPage()
      drawHeader()
      y = 22
    }
  }



  const writeText = (
    text: string,
    opts: { size?: number; bold?: boolean; color?: [number, number, number]; lineH?: number } = {}
  ) => {
    const { size = 10.5, bold = false, color = [215, 218, 228], lineH = 6 } = opts
    doc.setFontSize(size)
    doc.setFont("helvetica", bold ? "bold" : "normal")
    doc.setTextColor(color[0], color[1], color[2])
    const lines = doc.splitTextToSize(text, contentWidth)
    for (const line of lines) {
      checkPageBreak(lineH + 1)
      doc.text(line, marginX, y)
      y += lineH
    }
  }

  const drawSectionDivider = () => {
    checkPageBreak(6)
    doc.setDrawColor(40, 45, 60)
    doc.setLineWidth(0.2)
    doc.line(marginX, y, pageWidth - marginX, y)
    y += 5
  }

  const drawCallout = (
    label: string,
    text: string,
    bg: [number, number, number],
    border: [number, number, number]
  ) => {
    const lines = doc.splitTextToSize(text, contentWidth - 14)
    const boxH = lines.length * 5.5 + 16
    checkPageBreak(boxH + 4)
    doc.setFillColor(bg[0], bg[1], bg[2])
    doc.setDrawColor(border[0], border[1], border[2])
    doc.setLineWidth(0.4)
    doc.roundedRect(marginX, y, contentWidth, boxH, 3, 3, "FD")
    // Label
    doc.setFontSize(7)
    doc.setFont("helvetica", "bold")
    doc.setTextColor(border[0], border[1], border[2])
    doc.text(label.toUpperCase(), marginX + 6, y + 7)
    // Body
    doc.setFontSize(10)
    doc.setFont("helvetica", "normal")
    doc.setTextColor(210, 213, 224)
    let ty = y + 12.5
    for (const line of lines) {
      doc.text(line, marginX + 6, ty)
      ty += 5.5
    }
    y += boxH + 6
  }

  

  initPage()

  // Glowing circle decoration
  doc.setFillColor(56, 115, 255, 0.08)
  doc.circle(pageWidth - 30, 40, 50, "F")

  doc.setFontSize(26)
  doc.setFont("helvetica", "bold")
  doc.setTextColor(240, 242, 255)
  doc.text("AI Response Report", marginX + 4, 62)

  doc.setFontSize(11)
  doc.setFont("helvetica", "normal")
  doc.setTextColor(120, 125, 155)
  doc.text("Socratic AI Teaching Assistant", marginX + 4, 72)

  doc.setFillColor(56, 115, 255)
  doc.rect(marginX + 4, 78, 32, 0.8, "F")

  doc.setFontSize(9)
  doc.setTextColor(70, 75, 100)
  doc.text(
    `Document #${String(index + 1).padStart(4, "0")}   ·   ${new Date().toLocaleString("en-GB")}`,
    marginX + 4,
    86
  )


  doc.addPage()
  initPage()
  drawHeader()
  y = 24

  let parsed: AgentResponse | null = null
  try {
    parsed = JSON.parse(content)
  } catch {
    // Plain text fallback
  }

  if (parsed?.blocks) {
    for (const block of parsed.blocks) {
      switch (block.type) {
        case "heading": {
          checkPageBreak(16)
          y += 3
          doc.setFillColor(26, 28, 42)
          doc.roundedRect(marginX, y - 5, contentWidth, 13, 2, 2, "F")
          doc.setFontSize(13)
          doc.setFont("helvetica", "bold")
          doc.setTextColor(110, 165, 255)
          doc.text(block.text || "", marginX + 5, y + 4)
          y += 14
          break
        }

        case "text": {
          writeText(block.text || "", { size: 10.5, lineH: 6 })
          y += 2
          break
        }

        case "summary": {
          drawCallout("Summary", block.text || "", [18, 28, 52], [60, 120, 255])
          break
        }

        case "conclusion": {
          drawCallout("Conclusion", block.text || "", [20, 34, 24], [80, 195, 110])
          break
        }

        case "key_points": {
          checkPageBreak(14)
          writeText("Key Points", { size: 11, bold: true, color: [110, 165, 255] })
          y += 2
          for (const point of block.points || []) {
            const lines = doc.splitTextToSize(point, contentWidth - 12)
            checkPageBreak(lines.length * 5.5 + 3)
            doc.setFillColor(60, 115, 255)
            doc.circle(marginX + 2.5, y - 1.2, 1.2, "F")
            doc.setFontSize(10)
            doc.setFont("helvetica", "normal")
            doc.setTextColor(210, 213, 224)
            let py = y
            for (const l of lines) {
              doc.text(l, marginX + 8, py)
              py += 5.5
            }
            y = py + 1
          }
          y += 3
          break
        }

        case "list": {
          for (const item of block.items || []) {
            const lines = doc.splitTextToSize(item, contentWidth - 12)
            checkPageBreak(lines.length * 5.5 + 3)
            doc.setFillColor(130, 138, 165)
            doc.circle(marginX + 2.5, y - 1.2, 1, "F")
            doc.setFontSize(10)
            doc.setFont("helvetica", "normal")
            doc.setTextColor(210, 213, 224)
            let py = y
            for (const l of lines) {
              doc.text(l, marginX + 8, py)
              py += 5.5
            }
            y = py + 1
          }
          y += 3
          break
        }
      }
      drawSectionDivider()
    }

    // Metadata row
    if (parsed.metadata && Object.keys(parsed.metadata).length > 0) {
      checkPageBreak(18)
      y += 3
      const metaStr = Object.entries(parsed.metadata)
        .map(([k, v]) => `${k.replace(/_/g, " ")}: ${v}`)
        .join("   ·   ")
      doc.setFillColor(22, 24, 36)
      doc.setDrawColor(45, 50, 70)
      doc.setLineWidth(0.3)
      doc.roundedRect(marginX, y, contentWidth, 13, 2, 2, "FD")
      doc.setFontSize(7.5)
      doc.setFont("helvetica", "normal")
      doc.setTextColor(95, 100, 130)
      doc.text(metaStr, marginX + 5, y + 8)
      y += 17
    }
  } else {
    // Plain text fallback
    writeText(content, { size: 10.5, lineH: 6 })
  }


  const totalPages = doc.getNumberOfPages()
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p)
    drawFooter(p, totalPages)
  }

  doc.save(`Report_${String(index + 1).padStart(4, "0")}.pdf`)
}