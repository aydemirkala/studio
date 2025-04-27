export interface RecordData {
  id: string;
  systolic: number;
  diastolic: number;
  heartRate: number | null; // Make heartRate optional
  timestamp: string; // ISO string format
}

export interface Thresholds {
  systolic: number;
  diastolic: number;
  heartRate: number;
}
