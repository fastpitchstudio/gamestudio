// src/components/game/lineup/lineup-pdf-manager.tsx
import React, { useState } from 'react';
import { LineupPDFGenerator } from '@/lib/pdf/lineup-generator';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Printer, 
  FileDown, 
  Eye,
  Loader2 
} from 'lucide-react';

interface LineupPDFProps {
  teamName: string;
  coachName: string;
  opponent?: string;
  gameDate?: Date;
  location?: string;
  gameType?: string;
  players: Array<{
    order: number;
    number: string;
    name: string;
    position: string;
  }>;
}

type PrintFormat = '3inch' | '4x6' | 'glovers';

export default function LineupPDFManager({ 
  teamName, 
  coachName,
  opponent, 
  gameDate,
  location,
  gameType,
  players 
}: LineupPDFProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState<PrintFormat>('glovers');
  
  const generatePDF = async (format: PrintFormat) => {
    setIsGenerating(true);
    try {
      const generator = new LineupPDFGenerator(format);
      
      let pdfBlob;
      switch (format) {
        case '3inch':
          pdfBlob = await generator.generate3InchLabel({
            teamName, coachName, players
          });
          break;
        case '4x6':
          pdfBlob = await generator.generate4x6Card({
            teamName, coachName, opponent, gameDate, location, gameType, players
          });
          break;
        case 'glovers':
          pdfBlob = await generator.generateGloversStyle({
            teamName, coachName, opponent, gameDate, location, gameType, players
          });
          break;
      }

      const url = URL.createObjectURL(pdfBlob);
      setPdfUrl(url);
      return url;
    } catch (error) {
      console.error('PDF generation failed:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePrint = async () => {
    const url = pdfUrl || await generatePDF(selectedFormat);
    if (url) {
      const printWindow = window.open(url);
      printWindow?.print();
    }
  };

  const handleDownload = async () => {
    const url = pdfUrl || await generatePDF(selectedFormat);
    if (url) {
      const link = document.createElement('a');
      link.href = url;
      link.download = `${teamName}-lineup-${selectedFormat}-${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <h3 className="text-sm font-medium">Team</h3>
              <p className="text-lg">{teamName}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium">Coach</h3>
              <p className="text-lg">{coachName}</p>
            </div>
          </div>
          
          {opponent && gameDate && (
            <div className="grid grid-cols-2 gap-2">
              <div>
                <h3 className="text-sm font-medium">Opponent</h3>
                <p className="text-lg">{opponent}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium">Date</h3>
                <p className="text-lg">{gameDate.toLocaleDateString()}</p>
              </div>
            </div>
          )}
        </div>
      </Card>

      <div className="flex flex-col gap-4">
        <Select
          value={selectedFormat}
          onValueChange={(value: PrintFormat) => {
            setSelectedFormat(value);
            setPdfUrl(null);
          }}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select print format" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="3inch">3&quot; Label (Player List Only)</SelectItem>
            <SelectItem value="4x6">4x6&quot; Card</SelectItem>
            <SelectItem value="glovers">Glover&apos;s Style (5.5x8.5&quot;)</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex gap-2">
          <Button
            onClick={handlePrint}
            disabled={isGenerating}
            className="flex-1"
          >
            {isGenerating ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Printer className="w-4 h-4 mr-2" />
            )}
            Print Lineup
          </Button>

          <Button
            onClick={handleDownload}
            variant="outline"
            disabled={isGenerating}
          >
            <FileDown className="w-4 h-4 mr-2" />
            Download
          </Button>
        </div>
      </div>

      <div className="text-sm text-gray-500">
        {selectedFormat === '3inch' ? (
          'Tip: 3&quot; label contains only the player list for affixing to an existing lineup card'
        ) : selectedFormat === '4x6' ? (
          'Tip: 4x6&quot; card is ideal for index card printers'
        ) : (
          'Tip: Glover&apos;s style matches standard half-letter lineup cards'
        )}
      </div>
    </div>
  );
}