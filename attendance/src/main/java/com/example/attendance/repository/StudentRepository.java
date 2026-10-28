package com.example.attendance.repository;

import com.example.attendance.model.Student;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface StudentRepository extends JpaRepository<Student, Long> {
    boolean existsByRollNumber(String rollNumber);
    List<Student> findAllByOrderByRollNumberAsc();
}