import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { SensorData, HardwareModule } from '../types';

export function generateSystemReport(
  latestData: SensorData,
  history: SensorData[],
  hardwareModules: HardwareModule[]
): void {
  const doc = new jsPDF();
  const now = new Date();

  // Title
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('MDP IoT System Report', 105, 20, { align: 'center' });

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Generated: ${now.toLocaleString()}`, 105, 28, { align: 'center' });
  doc.text('GPS & Accident Detection System – Review III', 105, 34, { align: 'center' });

  // Horizontal line
  doc.setDrawColor(59, 130, 246);
  doc.setLineWidth(0.5);
  doc.line(20, 38, 190, 38);

  // Current Readings
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Current Sensor Readings', 20, 48);

  autoTable(doc, {
    startY: 52,
    head: [['Parameter', 'Value', 'Unit']],
    body: [
      ['GPS Latitude', String(latestData.gps.latitude), 'degrees'],
      ['GPS Longitude', String(latestData.gps.longitude), 'degrees'],
      ['Speed', String(latestData.gps.speed), 'km/h'],
      ['Altitude', String(latestData.gps.altitude), 'm'],
      ['Accelerometer X', String(latestData.accelerometer.x), 'm/s²'],
      ['Accelerometer Y', String(latestData.accelerometer.y), 'm/s²'],
      ['Accelerometer Z', String(latestData.accelerometer.z), 'm/s²'],
      ['Total Acceleration', String(latestData.totalAcceleration), 'm/s²'],
      ['Accident Detected', latestData.accidentDetected ? 'YES' : 'NO', '-'],
      ['Battery Level', `${latestData.batteryLevel}%`, '%'],
      ['Temperature', String(latestData.temperature), '°C'],
      ['System Status', latestData.systemStatus.toUpperCase(), '-'],
    ],
    theme: 'striped',
    headStyles: { fillColor: [59, 130, 246] },
  });

  // Hardware Status
  const finalY = (doc as unknown as Record<string, number>).lastAutoTable?.finalY ?? 160;
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Hardware Module Status', 20, finalY + 15);

  autoTable(doc, {
    startY: finalY + 20,
    head: [['Module', 'Status', 'Notes']],
    body: hardwareModules.map(m => [m.name, m.status.toUpperCase(), m.nextAction]),
    theme: 'striped',
    headStyles: { fillColor: [59, 130, 246] },
  });

  // Summary
  doc.addPage();
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Data Summary', 20, 20);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Total data points collected: ${history.length}`, 20, 30);
  doc.text(`Average speed: ${(history.reduce((s, d) => s + d.gps.speed, 0) / Math.max(history.length, 1)).toFixed(1)} km/h`, 20, 38);
  doc.text(`Average total acceleration: ${(history.reduce((s, d) => s + d.totalAcceleration, 0) / Math.max(history.length, 1)).toFixed(2)} m/s²`, 20, 46);
  doc.text(`Accident events in session: ${history.filter(d => d.accidentDetected).length}`, 20, 54);
  doc.text(`Execution Progress: 100%`, 20, 62);

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Project Status: Review III – 100% Execution Achieved', 20, 78);

  doc.save(`MDP_System_Report_${now.toISOString().split('T')[0]}.pdf`);
}
