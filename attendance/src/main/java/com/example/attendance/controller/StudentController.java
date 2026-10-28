package com.example.attendance.controller;

import com.example.attendance.model.Attendance;
import com.example.attendance.model.Student;
import com.example.attendance.repository.AttendanceRepository;
import com.example.attendance.repository.StudentRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/api/students")
public class StudentController {

    private final StudentRepository repository;
    private final AttendanceRepository attendanceRepository;

    public StudentController(StudentRepository repository,
                             AttendanceRepository attendanceRepository) {
        this.repository = repository;
        this.attendanceRepository = attendanceRepository;
    }

    @GetMapping
    public List<Student> getAll() {
        return repository.findAllByOrderByRollNumberAsc();
    }

    @PostMapping
    public Student create(@RequestBody Student student) {
        if (repository.existsByRollNumber(student.getRollNumber())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Roll number already exists");
        }
        student.setId(null);
        return repository.save(student);
    }

    // RENAME: updates the student and their old attendance rows
    @PutMapping("/{id}")
    @Transactional
    public ResponseEntity<Student> update(@PathVariable Long id,
                                          @RequestBody Student updated) {
        String newName = updated.getName() == null ? "" : updated.getName().trim();
        if (newName.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Name is required");
        }
        return repository.findById(id).map(existing -> {
            existing.setName(newName);
            List<Attendance> records =
                    attendanceRepository.findByRollNumber(existing.getRollNumber());
            records.forEach(r -> r.setStudentName(newName));
            attendanceRepository.saveAll(records);
            return ResponseEntity.ok(repository.save(existing));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        if (!repository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        repository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}