package com.windchill.service.plm;

import com.windchill.domain.entity.StateHistory;
import com.windchill.repository.StateHistoryRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class StateHistoryService {

    private final StateHistoryRepository repo;

    /**
     * Persist a state transition record.
     *
     * @param entityType PART, DOCUMENT, CHANGE_REQUEST, CHANGE_ORDER
     * @param entityId   primary key of the entity
     * @param fromState  previous lifecycle state (nullable for initial creation)
     * @param toState    new lifecycle state
     * @param transition PROMOTE, DEMOTE, REVISE, SUBMIT, APPROVE, REJECT, etc.
     * @param actor      username who performed the transition
     * @param comment    optional free-text detail
     */
    public StateHistory recordTransition(String entityType, Long entityId,
                                          String fromState, String toState,
                                          String transition, String actor, String comment) {
        StateHistory sh = new StateHistory();
        sh.setEntityType(entityType);
        sh.setEntityId(entityId);
        sh.setFromState(fromState);
        sh.setToState(toState);
        sh.setTransition(transition);
        sh.setActor(actor);
        sh.setComment(comment);
        StateHistory saved = repo.save(sh);
        log.debug("State history recorded: {}[{}] {} -> {} ({})", entityType, entityId, fromState, toState, transition);
        return saved;
    }

    /**
     * Returns the full transition history for an entity, newest first.
     */
    @Transactional(readOnly = true)
    public List<StateHistory> getHistory(String entityType, Long entityId) {
        return repo.findByEntityTypeAndEntityIdOrderByCreatedAtDesc(entityType, entityId);
    }

    /**
     * Returns the most recent toState for an entity, or null if no history exists.
     */
    @Transactional(readOnly = true)
    public String getLatestState(String entityType, Long entityId) {
        List<StateHistory> history = repo.findByEntityTypeAndEntityIdOrderByCreatedAtDesc(entityType, entityId);
        if (history.isEmpty()) return null;
        return history.get(0).getToState();
    }
}
