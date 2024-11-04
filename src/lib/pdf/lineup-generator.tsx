// src/lib/pdf/lineup-generator.ts
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

interface LineupPlayer {
  order: number;
  number: string;
  name: string;
  position: string;
}

interface LineupData {
  teamName: string;
  coachName: string;
  opponent?: string;
  gameDate?: Date;
  location?: string;
  gameType?: string;
  players: LineupPlayer[];
}

type PaperFormat = '3inch' | '4x6' | 'glovers';

export class LineupPDFGenerator {
  private doc: jsPDF;
  
  constructor(format: PaperFormat) {
    // Initialize with correct paper size
    const dimensions = this.getPaperDimensions(format);
    this.doc = new jsPDF({
      orientation: format === 'glovers' ? 'portrait' : 'landscape',
      unit: 'in',
      format: [dimensions.width, dimensions.height]
    });
  }

  private getPaperDimensions(format: PaperFormat) {
    switch (format) {
      case '3inch':
        return { width: 3, height: 11 };  // Standard thermal roll
      case '4x6':
        return { width: 4, height: 6 };   // Index card size
      case 'glovers':
        return { width: 5.5, height: 8.5 }; // Half letter
      default:
        return { width: 5.5, height: 8.5 };
    }
  }

  async generate3InchLabel(data: LineupData): Promise<Blob> {
    // Simple list format for adhering to existing lineup card
    this.doc.setFont('helvetica', 'normal');
    this.doc.setFontSize(10);

    let yPos = 0.3;
    data.players.forEach((player, index) => {
      const text = `${index + 1}. ${player.number.padStart(2)} ${player.name.padEnd(20)} ${player.position}`;
      this.doc.text(text, 0.2, yPos);
      yPos += 0.25;
    });

    return this.doc.output('blob');
  }

  async generate4x6Card(data: LineupData): Promise<Blob> {
    // Compact but complete lineup card
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(12);
    
    // Header
    this.doc.text(`Team: ${data.teamName}`, 0.3, 0.3);
    this.doc.text(`Coach: ${data.coachName}`, 0.3, 0.6);

    // Lineup table
    (this.doc as any).autoTable({
      startY: 0.9,
      head: [['#', 'No.', 'Player', 'Pos', 'Sub']],
      body: data.players.map(player => [
        player.order,
        player.number,
        player.name,
        player.position,
        ''  // Substitution column
      ]),
      styles: {
        fontSize: 8,
        cellPadding: 0.05
      },
      margin: { left: 0.3, right: 0.3 }
    });

    return this.doc.output('blob');
  }

  async generateGloversStyle(data: LineupData): Promise<Blob> {
    // Match Glover's layout exactly
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(14);
    
    // Title
    this.doc.text("GLOVER'S \"Line-Up Cards\"", 2.75, 0.4, { align: 'center' });

    // Team & Coach
    this.doc.setFontSize(10);
    this.doc.text('Team:', 0.5, 0.8);
    this.doc.text(data.teamName, 1.2, 0.8);
    this.doc.text('Coach:', 0.5, 1.1);
    this.doc.text(data.coachName, 1.2, 1.1);

    // Draw batting order text vertically
    this.doc.setFontSize(8);
    this.doc.text('BATTING ORDER', 0.3, 2.0, { angle: 90 });

    // Main lineup table
    (this.doc as any).autoTable({
      startY: 1.4,
      head: [['', 'NO.', 'PLAYER', 'POS', 'NO.', 'SUBSTITUTIONS', 'POS']],
      body: data.players.map((player, idx) => [
        idx + 1,
        player.number,
        player.name,
        player.position,
        '',  // Sub number
        '',  // Sub name
        ''   // Sub position
      ]),
      styles: {
        fontSize: 8,
        cellPadding: 0.05,
        lineWidth: 0.01
      },
      columnStyles: {
        0: { cellWidth: 0.3 },  // Order number
        1: { cellWidth: 0.4 },  // Number
        2: { cellWidth: 1.5 },  // Name
        3: { cellWidth: 0.4 },  // Position
        4: { cellWidth: 0.4 },  // Sub number
        5: { cellWidth: 1.5 },  // Sub name
        6: { cellWidth: 0.4 }   // Sub position
      },
      margin: { left: 0.5, right: 0.5 }
    });

    // Draw field diagram
    this.drawFieldDiagram(4, 7);

    return this.doc.output('blob');
  }

  private drawFieldDiagram(x: number, y: number): void {
    // Set drawing styles
    this.doc.setDrawColor(0);
    this.doc.setLineWidth(0.01);
    
    // Draw diamond
    const size = 0.8;
    // Home to first
    this.doc.line(x, y, x + size, y - size);
    // First to second
    this.doc.line(x + size, y - size, x, y - size * 2);
    // Second to third
    this.doc.line(x, y - size * 2, x - size, y - size);
    // Third to home
    this.doc.line(x - size, y - size, x, y);
    
    // Position numbers
    this.doc.setFontSize(6);
    // Pitcher
    this.doc.text('1', x, y - size);
    // Catcher
    this.doc.text('2', x, y + 0.1);
    // First base
    this.doc.text('3', x + size + 0.1, y - size);
    // Second base
    this.doc.text('4', x + 0.1, y - size * 2);
    // Third base
    this.doc.text('5', x - size - 0.1, y - size);
    // Shortstop
    this.doc.text('6', x - 0.2, y - size * 1.5);
    // Left field
    this.doc.text('7', x - size - 0.3, y - size * 1.5);
    // Center field
    this.doc.text('8', x, y - size * 2.5);
    // Right field
    this.doc.text('9', x + size + 0.3, y - size * 1.5);
  }
}