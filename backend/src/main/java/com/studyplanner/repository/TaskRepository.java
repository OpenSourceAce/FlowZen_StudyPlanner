package com.studyplanner.repository;

import com.studyplanner.model.Task;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface TaskRepository extends JpaRepository<Task, Long> {
    List<Task> findBySubjectId(Long subjectId);
    List<Task> findByCompleted(boolean completed);
    long countByCompleted(boolean completed);
    long countBySubjectId(Long subjectId);
}