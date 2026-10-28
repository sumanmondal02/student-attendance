package com.example.attendance.repository;

import com.example.attendance.model.Attendance;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface AttendanceRepository extends JpaRepository<Attendance, Long> {
    List<Attendance> findByDate(LocalDate date);
    Optional<Attendance> findByRollNumberAndDate(String rollNumber, LocalDate date);
    List<Attendance> findByRollNumber(String rollNumber);
}