package com.studyplanner.service;


import com.studyplanner.dto.DTOs.*;
import com.studyplanner.model.*;
import com.studyplanner.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import jakarta.persistence.EntityNotFoundException;
import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class StudyPlannerServiceFacade {

    private final SubjectRepository subjectRepo;
    private final TaskRepository taskRepo;
    private final StudySessionRepository sessionRepo;

    // ---- SUBJECTS ----
    public List<Subject> getAllSubjects() { return subjectRepo.findAll(); }

    public Subject getSubjectById(Long id) {
        return subjectRepo.findById(id).orElseThrow(() -> new EntityNotFoundException("Subject not found: " + id));
    }

    @Transactional
    public Subject createSubject(SubjectRequest req) {
        Subject s = Subject.builder().name(req.getName()).description(req.getDescription()).color(req.getColor() != null ? req.getColor() : "#6C63FF").build();
        return subjectRepo.save(s);
    }

    @Transactional
    public Subject updateSubject(Long id, SubjectRequest req) {
        Subject s = getSubjectById(id);
        if (req.getName() != null) s.setName(req.getName());
        if (req.getDescription() != null) s.setDescription(req.getDescription());
        if (req.getColor() != null) s.setColor(req.getColor());
        return subjectRepo.save(s);
    }

    @Transactional
    public void deleteSubject(Long id) {
        if (!subjectRepo.existsById(id)) throw new EntityNotFoundException("Subject not found: " + id);
        subjectRepo.deleteById(id);
    }

    // ---- TASKS ----
    public List<TaskResponse> getAllTasks() {
        return taskRepo.findAll().stream().map(this::toTaskResponse).collect(Collectors.toList());
    }

    public TaskResponse getTaskById(Long id) {
        return toTaskResponse(taskRepo.findById(id).orElseThrow(() -> new EntityNotFoundException("Task not found: " + id)));
    }

    @Transactional
    public TaskResponse createTask(TaskRequest req) {
        Task task = Task.builder().title(req.getTitle()).notes(req.getNotes()).dueDate(req.getDueDate()).priority(req.getPriority() != null ? req.getPriority() : Task.Priority.MEDIUM).build();
        if (req.getSubjectId() != null) task.setSubject(subjectRepo.findById(req.getSubjectId()).orElseThrow(() -> new EntityNotFoundException("Subject not found")));
        return toTaskResponse(taskRepo.save(task));
    }

    @Transactional
    public TaskResponse updateTask(Long id, TaskRequest req) {
        Task task = taskRepo.findById(id).orElseThrow(() -> new EntityNotFoundException("Task not found: " + id));
        if (req.getTitle() != null) task.setTitle(req.getTitle());
        if (req.getNotes() != null) task.setNotes(req.getNotes());
        if (req.getDueDate() != null) task.setDueDate(req.getDueDate());
        if (req.getPriority() != null) task.setPriority(req.getPriority());
        if (req.getSubjectId() != null) task.setSubject(subjectRepo.findById(req.getSubjectId()).orElse(null));
        else task.setSubject(null);
        return toTaskResponse(taskRepo.save(task));
    }

    @Transactional
    public TaskResponse toggleTask(Long id) {
        Task task = taskRepo.findById(id).orElseThrow(() -> new EntityNotFoundException("Task not found: " + id));
        task.setCompleted(!task.isCompleted());
        task.setCompletedAt(task.isCompleted() ? java.time.LocalDateTime.now() : null);
        return toTaskResponse(taskRepo.save(task));
    }

    @Transactional
    public void deleteTask(Long id) {
        if (!taskRepo.existsById(id)) throw new EntityNotFoundException("Task not found: " + id);
        taskRepo.deleteById(id);
    }

    private TaskResponse toTaskResponse(Task t) {
        TaskResponse r = new TaskResponse();
        r.setId(t.getId()); r.setTitle(t.getTitle()); r.setNotes(t.getNotes());
        r.setDueDate(t.getDueDate()); r.setPriority(t.getPriority()); r.setCompleted(t.isCompleted());
        r.setCompletedAt(t.getCompletedAt() != null ? t.getCompletedAt().toString() : null);
        r.setCreatedAt(t.getCreatedAt() != null ? t.getCreatedAt().toString() : null);
        if (t.getSubject() != null) { r.setSubjectId(t.getSubject().getId()); r.setSubjectName(t.getSubject().getName()); r.setSubjectColor(t.getSubject().getColor()); }
        return r;
    }

    // ---- SESSIONS ----
    public List<SessionResponse> getAllSessions() {
        return sessionRepo.findAll().stream().map(this::toSessionResponse).collect(Collectors.toList());
    }

    @Transactional
    public SessionResponse createSession(SessionRequest req) {
        Subject sub = subjectRepo.findById(req.getSubjectId()).orElseThrow(() -> new EntityNotFoundException("Subject not found"));
        StudySession s = StudySession.builder().subject(sub).date(req.getDate()).startTime(req.getStartTime()).endTime(req.getEndTime()).notes(req.getNotes()).build();
        return toSessionResponse(sessionRepo.save(s));
    }

    @Transactional
    public SessionResponse updateSession(Long id, SessionRequest req) {
        StudySession s = sessionRepo.findById(id).orElseThrow(() -> new EntityNotFoundException("Session not found: " + id));
        if (req.getSubjectId() != null) s.setSubject(subjectRepo.findById(req.getSubjectId()).orElseThrow(() -> new EntityNotFoundException("Subject not found")));
        if (req.getDate() != null) s.setDate(req.getDate());
        if (req.getStartTime() != null) s.setStartTime(req.getStartTime());
        if (req.getEndTime() != null) s.setEndTime(req.getEndTime());
        if (req.getNotes() != null) s.setNotes(req.getNotes());
        return toSessionResponse(sessionRepo.save(s));
    }

    @Transactional
    public void deleteSession(Long id) {
        if (!sessionRepo.existsById(id)) throw new EntityNotFoundException("Session not found: " + id);
        sessionRepo.deleteById(id);
    }

    private SessionResponse toSessionResponse(StudySession s) {
        SessionResponse r = new SessionResponse();
        r.setId(s.getId()); r.setDate(s.getDate()); r.setStartTime(s.getStartTime()); r.setEndTime(s.getEndTime()); r.setNotes(s.getNotes());
        if (s.getSubject() != null) { r.setSubjectId(s.getSubject().getId()); r.setSubjectName(s.getSubject().getName()); r.setSubjectColor(s.getSubject().getColor()); }
        return r;
    }

    // ---- STATS ----
    public StatsSummary getSummary() {
        StatsSummary s = new StatsSummary();
        s.setSubjects(subjectRepo.count());
        s.setTasksDone(taskRepo.countByCompleted(true));
        s.setTasksPending(taskRepo.countByCompleted(false));
        s.setStreak(0);
        return s;
    }

    public List<DailyActivity> getWeeklyActivity() {
        List<DailyActivity> result = new ArrayList<>();
        LocalDate today = LocalDate.now();
        for (int i = 6; i >= 0; i--) {
            LocalDate date = today.minusDays(i);
            DailyActivity da = new DailyActivity();
            da.setDate(date.toString());
            da.setCount(taskRepo.findAll().stream()
                .filter(t -> t.isCompleted() && t.getCompletedAt() != null && t.getCompletedAt().toLocalDate().equals(date))
                .count());
            result.add(da);
        }
        return result;
    }
}