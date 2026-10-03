import test from 'node:test';
import assert from 'node:assert/strict';
import { buildDemoData26 } from '../src/demoData26.js';

const weekdays = ['mon','tue','wed','thu','fri'];

test('Teaching CPD timetable demo has 26 realistic staff contracts', () => {
  const data = buildDemoData26();
  assert.equal(data.staff.length, 26);
  const fullTime = data.staff.filter((staff) => Number(staff.fte) >= 1);
  const partTime = data.staff.filter((staff) => Number(staff.fte) < 1);
  assert.equal(fullTime.length, 15);
  assert.equal(partTime.length, 11);
  for (const staff of fullTime) {
    assert.equal(weekdays.filter((day) => staff.availability?.[day] !== false).length, 5, `${staff.name} should work five days`);
  }
  for (const staff of partTime) {
    const days = weekdays.filter((day) => staff.availability?.[day] !== false).length;
    assert.ok(days >= 2 && days <= 4, `${staff.name} should work between two and four days`);
  }
});

test('demo timetable assignments respect teacher working days', () => {
  const data = buildDemoData26();
  const staff = new Map(data.staff.map((teacher) => [teacher.id, teacher]));
  for (const timetable of data.generatedTimetables || []) {
    for (const assignment of timetable.assignments || []) {
      const teacher = staff.get(assignment.teacherId);
      assert.ok(teacher, `Missing teacher ${assignment.teacherId}`);
      assert.notEqual(teacher.availability?.[assignment.dayKey], false, `${teacher.name} is scheduled on a non-working ${assignment.dayLabel || assignment.dayKey}`);
    }
  }
});
