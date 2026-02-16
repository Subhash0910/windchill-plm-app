@@
     public Part promote(Long id, LifecycleStateEnum target) {
-        Part part = getPart(id);
+        Part part = getPart(id);
         LifecycleStateEnum from = part.getLifecycleState();
@@
-        boolean allowed =
-                (from == LifecycleStateEnum.INWORK && target == LifecycleStateEnum.UNDERREVIEW)
-                        || (from == LifecycleStateEnum.UNDERREVIEW && target == LifecycleStateEnum.RELEASED)
-                        || (from == LifecycleStateEnum.RELEASED && target == LifecycleStateEnum.OBSOLETE);
+        boolean allowed =
+                (from == LifecycleStateEnum.INWORK && target == LifecycleStateEnum.UNDERREVIEW)
+                        || (from == LifecycleStateEnum.UNDERREVIEW && target == LifecycleStateEnum.RELEASED)
+                        || (from == LifecycleStateEnum.RELEASED && target == LifecycleStateEnum.OBSOLETE);
@@
-        part.setLifecycleState(target);
-        Part saved = partRepository.save(part);
-        auditService.log(PlmEntityTypeEnum.PART, saved.getId(), "PROMOTE", "Lifecycle: " + from + " -> " + target);
-        return saved;
+        // For INWORK -> UNDERREVIEW, start a Promotion Request workflow (ALL approvers)
+        if (from == LifecycleStateEnum.INWORK && target == LifecycleStateEnum.UNDERREVIEW) {
+            promotionWorkflowService.startPromotionRequest(part.getId(), LifecycleStateEnum.UNDERREVIEW);
+            // reload latest state
+            return getPart(part.getId());
+        }
+
+        part.setLifecycleState(target);
+        Part saved = partRepository.save(part);
+        auditService.log(PlmEntityTypeEnum.PART, saved.getId(), "PROMOTE", "Lifecycle: " + from + " -> " + target);
+        return saved;
     }
