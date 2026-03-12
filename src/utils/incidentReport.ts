import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { AccidentEvent } from '../types';

/**
 * Generate a PDF incident report for one or more accident events.
 */
export function generateIncidentReport(events: AccidentEvent[]): void {
  if (events.length === 0) return;

  const doc = new jsPDF();
  const now = new Date();

  // Title
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('Incident Report — Smart Safety Helmet', 105, 20, { align: 'center' });

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Generated: ${now.toLocaleString()}`, 105, 28, { align: 'center' });
  doc.text(`Total incidents: ${events.length}`, 105, 34, { align: 'center' });

  doc.setDrawColor(220, 38, 38);
  doc.setLineWidth(0.5);
  doc.line(20, 38, 190, 38);

  // Summary statistics
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Summary', 20, 48);

  const peakAccel = Math.max(...events.map(e => e.totalAcceleration));
  const avgAccel = events.reduce((s, e) => s + e.totalAcceleration, 0) / events.length;
  const resolvedCount = events.filter(e => e.resolved).length;
  const avgResponseTime = events
    .filter(e => e.resolved && e.resolvedAt)
    .map(e => ((e.resolvedAt! - e.timestamp) / 1000))
    .reduce((s, t, _, arr) => s + t / arr.length, 0);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Peak acceleration: ${peakAccel.toFixed(2)} m/s²`, 20, 56);
  doc.text(`Average acceleration: ${avgAccel.toFixed(2)} m/s²`, 20, 63);
  doc.text(`Resolved: ${resolvedCount}/${events.length}`, 20, 70);
  if (avgResponseTime > 0) {
    doc.text(`Average response time: ${avgResponseTime.toFixed(0)} seconds`, 20, 77);
  }

  // Events table
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Incident Details', 20, 90);

  autoTable(doc, {
    startY: 95,
    head: [['#', 'Time', 'Location', 'Speed', 'Accel (m/s²)', 'Status', 'Response Time']],
    body: events.map((e, i) => [
      String(i + 1),
      new Date(e.timestamp).toLocaleString(),
      `${e.gps.latitude.toFixed(4)}°, ${e.gps.longitude.toFixed(4)}°`,
      `${e.gps.speed} km/h`,
      e.totalAcceleration.toFixed(2),
      e.resolved ? 'RESOLVED' : 'ACTIVE',
      e.resolved && e.resolvedAt
        ? `${Math.round((e.resolvedAt - e.timestamp) / 1000)}s`
        : 'Pending',
    ]),
    theme: 'striped',
    headStyles: { fillColor: [220, 38, 38] },
    columnStyles: {
      0: { cellWidth: 10 },
      5: { fontStyle: 'bold' },
    },
  });

  // Per-event detail pages (for events with significant acceleration)
  const significant = events.filter(e => e.totalAcceleration > 20);
  if (significant.length > 0) {
    doc.addPage();
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Detailed Incident Analysis', 20, 20);

    let yPos = 32;
    for (const event of significant) {
      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text(`Incident #${event.id} — ${new Date(event.timestamp).toLocaleString()}`, 20, yPos);
      yPos += 8;

      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text(`Accel X: ${event.accelerometer.x.toFixed(3)} | Y: ${event.accelerometer.y.toFixed(3)} | Z: ${event.accelerometer.z.toFixed(3)}`, 24, yPos);
      yPos += 6;
      doc.text(`Total: ${event.totalAcceleration.toFixed(2)} m/s² | Speed: ${event.gps.speed} km/h | Alt: ${event.gps.altitude} m`, 24, yPos);
      yPos += 6;
      doc.text(`GPS: ${event.gps.latitude.toFixed(6)}°, ${event.gps.longitude.toFixed(6)}°`, 24, yPos);
      yPos += 10;
    }
  }

  doc.save(`Incident_Report_${now.toISOString().split('T')[0]}.pdf`);
}

/**
 * Export accident events as CSV.
 */
export function exportIncidentCSV(events: AccidentEvent[]): string {
  const headers = 'ID,Timestamp,Latitude,Longitude,Speed,Altitude,AccX,AccY,AccZ,TotalAccel,Resolved,ResponseTime_s\n';
  const rows = events.map(e => {
    const respTime = e.resolved && e.resolvedAt ? Math.round((e.resolvedAt - e.timestamp) / 1000) : '';
    return `${e.id},${new Date(e.timestamp).toISOString()},${e.gps.latitude},${e.gps.longitude},${e.gps.speed},${e.gps.altitude},${e.accelerometer.x},${e.accelerometer.y},${e.accelerometer.z},${e.totalAcceleration},${e.resolved},${respTime}`;
  }).join('\n');
  return headers + rows;
}
