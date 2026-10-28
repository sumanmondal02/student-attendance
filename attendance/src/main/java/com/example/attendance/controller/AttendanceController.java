package com.example.attendance.controller;

import com.example.attendance.model.Attendance;
import com.example.attendance.repository.AttendanceRepository;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/api/attendance")
public class AttendanceController {

    private final AttendanceRepository repository;

    public AttendanceController(AttendanceRepository repository) {
        this.repository = repository;
    }

    private void checkNotFuture(LocalDate date) {
        if (date == null || date.isAfter(LocalDate.now())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Future dates are not allowed");
        }
    }

    // CREATE
    @PostMapping
    public Attendance create(@RequestBody Attendance attendance) {
        checkNotFuture(attendance.getDate());
        attendance.setId(null);
        return repository.save(attendance);
    }

    // BULK SAVE: creates or updates one record per student for a date
    @PostMapping("/bulk")
    @Transactional
    public List<Attendance> saveBulk(@RequestBody List<Attendance> entries) {
        List<Attendance> toSave = new ArrayList<>();
        for (Attendance e : entries) {
            checkNotFuture(e.getDate());
            Attendance record = repository
                    .findByRollNumberAndDate(e.getRollNumber(), e.getDate())
                    .orElseGet(Attendance::new);
            record.setRollNumber(e.getRollNumber());
            record.setStudentName(e.getStudentName());
            record.setDate(e.getDate());
            record.setStatus(e.getStatus());
            toSave.add(record);
        }
        return repository.saveAll(toSave);
    }

    // READ ALL (optional ?date=2026-10-28)
    @GetMapping
    public List<Attendance> getAll(
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return date == null ? repository.findAll() : repository.findByDate(date);
    }

    // READ ONE
    @GetMapping("/{id}")
    public ResponseEntity<Attendance> getOne(@PathVariable Long id) {
        return repository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // UPDATE
    @PutMapping("/{id}")
    public ResponseEntity<Attendance> update(@PathVariable Long id,
                                             @RequestBody Attendance updated) {
        checkNotFuture(updated.getDate());
        return repository.findById(id).map(existing -> {
            existing.setRollNumber(updated.getRollNumber());
            existing.setStudentName(updated.getStudentName());
            existing.setDate(updated.getDate());
            existing.setStatus(updated.getStatus());
            return ResponseEntity.ok(repository.save(existing));
        }).orElse(ResponseEntity.notFound().build());
    }

    // DELETE
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        if (!repository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        repository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}