package lk.careflow.repository.doctor;

import lk.careflow.entity.doctor.Department;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DepartmentRepository extends JpaRepository<Department, Long> {

    boolean existsByNameIgnoreCase(String name);

    boolean existsByCodeIgnoreCase(String code);

    Optional<Department> findByCodeIgnoreCase(String code);

    List<Department> findByIsActiveTrueOrderByNameAsc();

    List<Department> findAllByOrderByNameAsc();
}
