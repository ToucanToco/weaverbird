<template functional>
  <div class="vqb-modal">
    <div class="vqb-modal__backdrop" />
    <div class="vqb-modal__container">
      <div class="vqb-modal__body" style="width: 500px;">
        <i class="vqb-modal__close fas fa-times" @click="listeners['cancelDelete']" />
        <div class="vqb-modal__header">
          <div class="vqb-modal__title">Delete this step?</div>
        </div>
        <div class="vqb-modal__section">
          <div class="vqb-modal__text">Are you sure you want to delete this step?</div>
          <strong class="vqb-modal__text">
            This action cannot be undone and may create conflicts with following steps if any.
          </strong>
        </div>
        <div class="vqb-modal__footer">
          <div
            class="vqb-modal__action vqb-modal__action--secondary"
            @click="listeners['cancelDelete']"
          >
            cancel
          </div>
          <div
            class="vqb-modal__action vqb-modal__action--primary"
            @click="listeners['validateDelete']"
          >
            confirm
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
/**
 * @name DeleteConfirmationModal
 * @description A modal asking for confirmation before deleting a step
 */
export default {
  name: 'delete-confirmation-modal',
};
</script>

<style lang="scss" scoped>

.vqb-modal {
  bottom: 0;
  display: flex;
  flex-direction: column;
  left: 0;
  overflow: auto;
  position: fixed;
  right: 0;
  top: 0;
  z-index: 999;
}

.vqb-modal__backdrop {
  background-color: rgba(0, 0, 0, 0.54);
  bottom: 0;
  left: 0;
  position: fixed;
  right: 0;
  top: 0;
}

.vqb-modal__container {
  align-items: center;
  display: flex;
  flex-shrink: 0;
  justify-content: center;
  min-height: 100%;
  padding: 40px 40px 20px;
  width: 100%;
}

.vqb-modal__body {
  background-color: #fff;
  border-radius: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.33);
  position: relative;
}

.vqb-modal__close {
  color: #4c4c4c;
  font-size: 30px;
  position: absolute;
  top: 15px;
  right: 30px;
}

.fa-times {
  cursor: pointer;
}

.vqb-modal__header {
  background-color: #f5f5f5;
  border-top-left-radius: 20px;
  border-top-right-radius: 20px;
  display: flex;
  padding: 20px 30px;
}

.vqb-modal__title {
  font-size: 12px;
  letter-spacing: 0.25px;
  line-height: 20px;
  color: #4c4c4c;
  font-weight: 700;
  font-size: 18px;
}

.vqb-modal__section {
  box-shadow: inset 0 -1px 0 0 #f5f5f5;
  padding: 25px 30px;
}

.vqb-modal__text {
  font-size: 14px;
  letter-spacing: 0.25px;
  line-height: 22px;
  color: #4c4c4c;
  font-weight: 400;
}

strong.vqb-modal__text {
  display: block;
  font-weight: 700;
}

.vqb-modal__footer {
  border-bottom-left-radius: 4px;
  border-bottom-right-radius: 4px;
  display: flex;
  justify-content: center;
  padding: 30px;
}

.vqb-modal__action {
  font-size: 12px;
  letter-spacing: 0.25px;
  line-height: 20px;
  cursor: pointer;
  font-weight: 700;
  padding: 10px 30px;
  text-transform: uppercase;
}

.vqb-modal__action--secondary {
  background-color: #f5f5f5;
  color: #a5a5a5;
  margin-right: 20px;
  border: none;
}

.vqb-modal__action--primary {
  background-color: #4c4c4c;
  color: #fff;
  border: none;
}

</style>
