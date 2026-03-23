package com.studyplanner.controller;


import com.studyplanner.dto.DTOs.*;
import com.studyplanner.model.Subject;
import com.studyplanner.service.StudyPlannerServiceFacade;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/subjects")
@RequiredArgsConstructor
class SubjectController {
    private final StudyPlannerServiceFacade service;

    @GetMapping
    public ResponseEntity<List<Subject>> getAll() { return ResponseEntity.ok(service.getAllSubjects()); }

    @GetMapping("/{id}")
    public ResponseEntity<Subject> getById(@PathVariable Long id) { return ResponseEntity.ok(service.getSubjectById(id)); }

    @PostMapping
    public ResponseEntity<Subject> create(@RequestBody SubjectRequest req) { return ResponseEntity.status(HttpStatus.CREATED).body(service.createSubject(req)); }

    @PutMapping("/{id}")
    public ResponseEntity<Subject> update(@PathVariable Long id, @RequestBody SubjectRequest req) { return ResponseEntity.ok(service.updateSubject(id, req)); }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) { service.deleteSubject(id); return ResponseEntity.noContent().build(); }
}

@RestController
@RequestMapping("/api/tasks")
@RequiredArgsConstructor
class TaskController {
    private final StudyPlannerServiceFacade service;

    @GetMapping
    public ResponseEntity<List<TaskResponse>> getAll() { return ResponseEntity.ok(service.getAllTasks()); }

    @GetMapping("/{id}")
    public ResponseEntity<TaskResponse> getById(@PathVariable Long id) { return ResponseEntity.ok(service.getTaskById(id)); }

    @PostMapping
    public ResponseEntity<TaskResponse> create(@RequestBody TaskRequest req) { return ResponseEntity.status(HttpStatus.CREATED).body(service.createTask(req)); }

    @PutMapping("/{id}")
    public ResponseEntity<TaskResponse> update(@PathVariable Long id, @RequestBody TaskRequest req) { return ResponseEntity.ok(service.updateTask(id, req)); }

    @PatchMapping("/{id}/toggle")
    public ResponseEntity<TaskResponse> toggle(@PathVariable Long id) { return ResponseEntity.ok(service.toggleTask(id)); }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) { service.deleteTask(id); return ResponseEntity.noContent().build(); }
}

@RestController
@RequestMapping("/api/sessions")
@RequiredArgsConstructor
class StudySessionController {
    private final StudyPlannerServiceFacade service;

    @GetMapping
    public ResponseEntity<List<SessionResponse>> getAll() { return ResponseEntity.ok(service.getAllSessions()); }

    @PostMapping
    public ResponseEntity<SessionResponse> create(@RequestBody SessionRequest req) { return ResponseEntity.status(HttpStatus.CREATED).body(service.createSession(req)); }

    @PutMapping("/{id}")
    public ResponseEntity<SessionResponse> update(@PathVariable Long id, @RequestBody SessionRequest req) { return ResponseEntity.ok(service.updateSession(id, req)); }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) { service.deleteSession(id); return ResponseEntity.noContent().build(); }
}

@RestController
@RequestMapping("/api/stats")
@RequiredArgsConstructor
class StatsController {
    private final StudyPlannerServiceFacade service;

    @GetMapping("/summary")
    public ResponseEntity<StatsSummary> getSummary() { return ResponseEntity.ok(service.getSummary()); }

    @GetMapping("/weekly")
    public ResponseEntity<List<DailyActivity>> getWeekly() { return ResponseEntity.ok(service.getWeeklyActivity()); }
}

@RestControllerAdvice
class GlobalExceptionHandler {

    @ExceptionHandler(jakarta.persistence.EntityNotFoundException.class)
    public ResponseEntity<ApiError> handleNotFound(jakarta.persistence.EntityNotFoundException e) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(new ApiError(404, e.getMessage()));
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ApiError> handleBadRequest(IllegalArgumentException e) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(new ApiError(400, e.getMessage()));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiError> handleGeneral(Exception e) {
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(new ApiError(500, "Error: " + e.getMessage()));
    }
}