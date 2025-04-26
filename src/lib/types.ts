export interface RecordData {
  id: string;
  systolic: number;
  diastolic: number;
  heartRate: number;
  timestamp: string; // ISO string format
}

export interface Thresholds {
  systolic: number;
  diastolic: number;
  heartRate: number;
}
