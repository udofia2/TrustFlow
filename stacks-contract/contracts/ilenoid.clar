;; Ilenoid - Transparent Charity Tracker on Stacks
;; A milestone-based charity donation escrow with weighted donor voting
;; Built with Clarity 4, epoch "latest"

(define-trait sip-010-trait
  (
    (transfer (uint principal principal (optional (buff 34))) (response bool uint))
  )
)

;; Define the SIP-010 trait structure so the contract understands '<token-contract>'
(define-trait token-contract
  (
    (transfer (uint principal principal (optional (buff 34))) (response bool uint))
    (get-name () (response (string-ascii 32) uint))
    (get-symbol () (response (string-ascii 32) uint))
    (get-decimals () (response uint uint))
    (get-balance (principal) (response uint uint))
    (get-total-supply () (response uint uint))
    (get-token-uri () (response (optional (string-utf8 256)) uint))
  )
)


;; =============================================================
;;                      ERROR CONSTANTS
;; =============================================================

;; ETH/STX Handling
(define-constant ERR_DIRECT_STX_SEND_REJECTED (err u1))

;; NGO Management
(define-constant ERR_INVALID_NGO (err u10))
(define-constant ERR_NGO_ALREADY_VERIFIED (err u11))
(define-constant ERR_NGO_NOT_VERIFIED (err u12))
(define-constant ERR_NOT_VERIFIED_NGO (err u13))

;; Project Creation
(define-constant ERR_INVALID_GOAL (err u20))
(define-constant ERR_INVALID_MILESTONE_ARRAYS (err u21))
(define-constant ERR_INVALID_MILESTONE_AMOUNT (err u22))
(define-constant ERR_MILESTONE_SUM_EXCEEDS_GOAL (err u23))

;; Donations
(define-constant ERR_PROJECT_NOT_FOUND (err u30))
(define-constant ERR_PROJECT_NOT_ACTIVE (err u31))
(define-constant ERR_PROJECT_COMPLETED (err u32))
(define-constant ERR_INVALID_DONATION_AMOUNT (err u33))
(define-constant ERR_INVALID_DONATION_TOKEN (err u34))
(define-constant ERR_INSUFFICIENT_ALLOWANCE (err u35))
(define-constant ERR_INSUFFICIENT_BALANCE (err u36))

;; Voting
(define-constant ERR_NO_CONTRIBUTION (err u40))
(define-constant ERR_ALREADY_VOTED (err u41))
(define-constant ERR_MILESTONE_ALREADY_APPROVED (err u42))
(define-constant ERR_NO_CURRENT_MILESTONE (err u43))

;; Fund Release
(define-constant ERR_NOT_PROJECT_NGO (err u50))
(define-constant ERR_MILESTONE_NOT_APPROVED (err u51))
(define-constant ERR_MILESTONE_ALREADY_RELEASED (err u52))
(define-constant ERR_INSUFFICIENT_PROJECT_BALANCE (err u53))
(define-constant ERR_QUORUM_NOT_MET (err u54))

;; Pause Control
(define-constant ERR_CONTRACT_PAUSED (err u60))
(define-constant ERR_UNAUTHORIZED (err u61))


;; =============================================================
;;                      OWNER CONSTANT
;; =============================================================

;; Contract owner (set at deployment time via tx-sender)
(define-constant CONTRACT_OWNER tx-sender)

;; =============================================================
;;                      DATA VARIABLES
;; =============================================================

;; Project counter (starts at 0, first project will be 1)
(define-data-var project-counter uint u0)

;; Contract pause state
(define-data-var contract-paused bool false)

;; =============================================================
;;                      DATA MAPS
;; =============================================================

;; Verified NGOs: principal -> bool
;; Maps NGO addresses to their verification status
(define-map verified-ngos principal bool)

;; Projects: project-id (uint) -> Project struct
;; Stores all project information
(define-map projects
  uint
  {
    id: uint,
    ngo: principal,
    donation-token: (optional principal), ;; none = STX, (some principal) = SIP-010 token
    goal: uint,
    total-donated: uint,
    balance: uint,
    current-milestone: uint, ;; Current milestone index (starts at 0)
    is-active: bool,
    is-completed: bool
  }
)

;; Milestones: {project-id: uint, milestone-id: uint} -> Milestone struct
;; Stores milestone information for each project
(define-map milestones
  {project-id: uint, milestone-id: uint}
  {
    description: (string-utf8 500),
    amount-requested: uint,
    approved: bool,
    funds-released: bool,
    vote-weight: uint ;; Total vote weight for this milestone
  }
)

;; Project Milestone Count: project-id (uint) -> milestone-count (uint)
;; Stores the total number of milestones for each project
(define-map project-milestone-count uint uint)

;; Donor Contributions: {project-id: uint, donor: principal} -> amount (uint)
;; Tracks how much each donor has contributed to each project
(define-map donor-contributions
  {project-id: uint, donor: principal}
  uint
)

;; Total Project Donations: project-id (uint) -> total-donations (uint)
;; Tracks the total donations received for each project
(define-map total-project-donations uint uint)

;; Has Voted: {project-id: uint, milestone-id: uint, donor: principal} -> has-voted (bool)
;; Tracks whether a donor has voted on a specific milestone
(define-map has-voted
  {project-id: uint, milestone-id: uint, donor: principal}
  bool
)

;; Milestone Snapshot Donations: {project-id: uint, milestone-id: uint} -> snapshot (uint)
;; Stores the total donations at the time the first vote was cast for a milestone
;; This prevents manipulation by allowing donations after voting starts
(define-map milestone-snapshot-donations
  {project-id: uint, milestone-id: uint}
  uint
)

;; =============================================================
;;                  ACCESS CONTROL & PAUSE
;; =============================================================

;; Private function to check if caller is the contract owner
(define-private (is-owner?)
  (is-eq tx-sender CONTRACT_OWNER)
)

;; Private helper to check if contract is not paused
;; Returns true if not paused, false if paused
(define-private (check-not-paused)
  (not (var-get contract-paused))
)

;; Pause the contract (blocks donations and fund releases)
;; Only callable by contract owner
(define-public (pause)
  (begin
    (asserts! (is-owner?) ERR_UNAUTHORIZED)
    (ok (var-set contract-paused true))
  )
)

;; Unpause the contract
;; Only callable by contract owner
(define-public (unpause)
  (begin
    (asserts! (is-owner?) ERR_UNAUTHORIZED)
    (ok (var-set contract-paused false))
  )
)

;; =============================================================
;;                      NGO MANAGEMENT
;; =============================================================

;; Register a new NGO as verified
;; Only callable by contract owner
;; @param ngo: The principal address of the NGO to register
;; @return: (ok true) on success
(define-public (register-ngo (ngo principal))
  (begin
    ;; Check: Caller is owner
    (asserts! (is-owner?) ERR_UNAUTHORIZED)
    ;; Check: Contract is not paused
    (asserts! (check-not-paused) ERR_CONTRACT_PAUSED)
    ;; Check: NGO is not already verified
    (asserts! (not (default-to false (map-get? verified-ngos ngo))) ERR_NGO_ALREADY_VERIFIED)
    ;; Set NGO as verified
    (map-set verified-ngos ngo true)
    (ok true)
  )
)

;; Revoke verification status of an NGO
;; Only callable by contract owner
;; @param ngo: The principal address of the NGO to revoke
;; @return: (ok true) on success
(define-public (revoke-ngo (ngo principal))
  (begin
    ;; Check: Caller is owner
    (asserts! (is-owner?) ERR_UNAUTHORIZED)
    ;; Check: NGO is currently verified
    (asserts! (default-to false (map-get? verified-ngos ngo)) ERR_NGO_NOT_VERIFIED)
    ;; Revoke NGO verification
    (map-set verified-ngos ngo false)
    (ok true)
  )
)

;; Check if an address is a verified NGO
;; Read-only function
;; @param ngo: The principal address to check
;; @return: true if verified, false otherwise
(define-read-only (is-verified-ngo (ngo principal))
  (default-to false (map-get? verified-ngos ngo))
)

;; =============================================================
;;                      PROJECT CREATION
;; =============================================================

;; Helper function for fold to process each milestone
;; This processes one milestone and accumulates the total
(define-private (process-milestone-item
  (description (string-utf8 500))
  (acc {total: uint, index: uint, valid: bool, project-id: uint, amounts: (list 50 uint)})
)
  (let ((current-index (get index acc))
        (current-total (get total acc))
        (current-valid (get valid acc))
        (project-id (get project-id acc))
        (amounts (get amounts acc)))
    (if (not current-valid)
      acc
      (match (element-at amounts current-index) amount
        (if (is-eq amount u0)
          {total: current-total, index: (+ current-index u1), valid: false, project-id: project-id, amounts: amounts}
          (begin
            (map-set milestones 
              {project-id: project-id, milestone-id: current-index}
              {
                description: description,
                amount-requested: amount,
                approved: false,
                funds-released: false,
                vote-weight: u0
              }
            )
            {total: (+ current-total amount), index: (+ current-index u1), valid: true, project-id: project-id, amounts: amounts}
          )
        )
        {total: current-total, index: (+ current-index u1), valid: false, project-id: project-id, amounts: amounts}
      )
    )
  )
)

;; Create a new project with milestones
;; Only callable by verified NGOs
;; @param donation-token: (optional principal) - none for STX, (some principal) for SIP-010 token
;; @param goal: The total fundraising goal for the project
;; @param descriptions: List of milestone descriptions
;; @param amounts: List of milestone funding amounts (must match descriptions length)
;; @return: (ok project-id) on success
(define-public (create-project
  (donation-token (optional principal))
  (goal uint)
  (descriptions (list 50 (string-utf8 500)))
  (amounts (list 50 uint))
)
  (begin
    ;; Check: Caller is verified NGO
    (asserts! (is-verified-ngo tx-sender) ERR_NOT_VERIFIED_NGO)
    ;; Check: Contract is not paused
    (asserts! (check-not-paused) ERR_CONTRACT_PAUSED)
    ;; Check: Goal > 0
    (asserts! (> goal u0) ERR_INVALID_GOAL)
    ;; Check: Descriptions and amounts have same length
    (asserts! (is-eq (len descriptions) (len amounts)) ERR_INVALID_MILESTONE_ARRAYS)
    ;; Check: At least one milestone
    (asserts! (> (len descriptions) u0) ERR_INVALID_MILESTONE_ARRAYS)
    ;; Calculate project ID first
    (let ((new-counter (+ (var-get project-counter) u1))
          (project-id new-counter))
      ;; Validate, sum, and create milestones using fold
      (let ((milestone-result (fold process-milestone-item descriptions
        {total: u0, index: u0, valid: true, project-id: project-id, amounts: amounts}
      )))
        (let ((total-amounts (get total milestone-result))
              (is-valid (get valid milestone-result)))
          ;; Check: All milestones were valid
          (asserts! is-valid ERR_INVALID_MILESTONE_AMOUNT)
          ;; Check: Sum of amounts <= goal
          (asserts! (<= total-amounts goal) ERR_MILESTONE_SUM_EXCEEDS_GOAL)
          (begin
            ;; Update project counter
            (var-set project-counter new-counter)
            ;; Create and store project
            (map-set projects project-id {
              id: project-id,
              ngo: tx-sender,
              donation-token: donation-token,
              goal: goal,
              total-donated: u0,
              balance: u0,
              current-milestone: u0,
              is-active: true,
              is-completed: false
            })
            ;; Store milestone count
            (map-set project-milestone-count project-id (len descriptions))
            (ok project-id)
          )
        )
      )
    )
  )
)

;; =============================================================
;;                      STX DONATIONS
;; =============================================================

;; Donate STX to a project
;; @param project-id: The ID of the project to donate to
;; @param amount: The amount of STX to donate (in microstacks)
;; @return: (ok amount) on success
;; @dev Only works for projects that accept STX donations (donation-token is none).
;;      Frontend must send STX with the transaction using post-conditions.
;;      Updates all donation accounting.
(define-public (donate (project-id uint) (amount uint))
  (let ((project (unwrap! (map-get? projects project-id) ERR_PROJECT_NOT_FOUND)))
    (begin
      ;; Check: Project exists (already checked via unwrap!)
      ;; Check: Project is active
      (asserts! (get is-active project) ERR_PROJECT_NOT_ACTIVE)
      ;; Check: Project is not completed
      (asserts! (not (get is-completed project)) ERR_PROJECT_COMPLETED)
      ;; Check: Amount > 0
      (asserts! (> amount u0) ERR_INVALID_DONATION_AMOUNT)
      ;; Check: Project accepts STX (donation-token is none)
      (asserts! (is-none (get donation-token project)) ERR_INVALID_DONATION_TOKEN)
      ;; Check: Contract is not paused
      (asserts! (check-not-paused) ERR_CONTRACT_PAUSED)
      ;; Transfer STX from tx-sender to contract
      (try! (stx-transfer? amount tx-sender current-contract))
      ;; Update donor contributions
      (let ((current-contribution (default-to u0 (map-get? donor-contributions {project-id: project-id, donor: tx-sender}))))
        (map-set donor-contributions {project-id: project-id, donor: tx-sender} (+ current-contribution amount))
      )
      ;; Update total project donations
      (let ((current-total (default-to u0 (map-get? total-project-donations project-id))))
        (map-set total-project-donations project-id (+ current-total amount))
      )
      ;; Update project's total-donated and balance
      (map-set projects project-id (merge project {
        total-donated: (+ (get total-donated project) amount),
        balance: (+ (get balance project) amount)
      }))
      (ok amount)
    )
  )
)

;; =============================================================
;;                  SIP-010 TOKEN DONATIONS
;; =============================================================

;; Donate SIP-010 fungible tokens to a project
;; @param project-id: The ID of the project to donate to
;; @param token-trait: The SIP-010 token trait reference
;; @param amount: The amount of tokens to donate
;; @return: (ok amount) on success
;; @dev Only works for projects that accept token donations (donation-token matches token-trait).
;;      Calls the SIP-010 transfer function via contract-call?.
;;      Updates all donation accounting.
(define-public (donate-token
  (project-id uint)
  (token-trait <sip-010-trait>)
  (amount uint)
)
  (let ((project (unwrap! (map-get? projects project-id) ERR_PROJECT_NOT_FOUND)))
    (begin
      ;; Check: Project exists (already checked via unwrap!)
      ;; Check: Project is active
      (asserts! (get is-active project) ERR_PROJECT_NOT_ACTIVE)
      ;; Check: Project is not completed
      (asserts! (not (get is-completed project)) ERR_PROJECT_COMPLETED)
      ;; Check: Amount > 0
      (asserts! (> amount u0) ERR_INVALID_DONATION_AMOUNT)
      ;; Check: Project accepts tokens (donation-token is not none)
      (asserts! (is-some (get donation-token project)) ERR_INVALID_DONATION_TOKEN)
      ;; Check: Token contract matches project's donation-token
      (asserts! (is-eq (contract-of token-trait) (unwrap-panic (get donation-token project))) ERR_INVALID_DONATION_TOKEN)
      ;; Check: Contract is not paused
      (asserts! (check-not-paused) ERR_CONTRACT_PAUSED)
      ;; Call SIP-010 transfer function: transfer from tx-sender to contract
      ;; SIP-010 signature: (transfer (uint principal principal (optional (buff 34))) (response bool uint))
      ;; Note: Clarity 4 static analyzer may show a false positive trait error here, but the code is correct
      (try! (contract-call? token-trait transfer amount tx-sender current-contract none))
      ;; Update donor contributions
      (let ((current-contribution (default-to u0 (map-get? donor-contributions {project-id: project-id, donor: tx-sender}))))
        (map-set donor-contributions {project-id: project-id, donor: tx-sender} (+ current-contribution amount))
      )
      ;; Update total project donations
      (let ((current-total (default-to u0 (map-get? total-project-donations project-id))))
        (map-set total-project-donations project-id (+ current-total amount))
      )
      ;; Update project's total-donated and balance
      (map-set projects project-id (merge project {
        total-donated: (+ (get total-donated project) amount),
        balance: (+ (get balance project) amount)
      }))
      (ok amount)
    )
  )
)

;; =============================================================
;;                    MILESTONE VOTING
;; =============================================================

;; Vote on the current milestone for a project
;; @param project-id: The ID of the project to vote on
;; @return: (ok vote-weight) on success
;; @dev Only donors with contributions can vote. Vote weight equals total contribution.
;;      One vote per milestone per donor. Snapshot is taken on first vote to prevent
;;      donations after voting starts from affecting the quorum calculation.
(define-public (vote-on-milestone
  (project-id uint)
)
  (let ((project (unwrap! (map-get? projects project-id) ERR_PROJECT_NOT_FOUND)))
    (let ((current-milestone-id (get current-milestone project)))
      (let ((milestone-count (unwrap! (map-get? project-milestone-count project-id) ERR_NO_CURRENT_MILESTONE)))
        (let ((milestone (unwrap! (map-get? milestones {project-id: project-id, milestone-id: current-milestone-id}) ERR_NO_CURRENT_MILESTONE)))
          (let ((donor-contribution (default-to u0 (map-get? donor-contributions {project-id: project-id, donor: tx-sender}))))
            (begin
              ;; Check: Project exists (already checked via unwrap!)
              ;; Check: Current milestone exists (current-milestone-id < milestone-count)
              (asserts! (< current-milestone-id milestone-count) ERR_NO_CURRENT_MILESTONE)
              ;; Check: Milestone not approved
              (asserts! (not (get approved milestone)) ERR_MILESTONE_ALREADY_APPROVED)
              ;; Check: Donor has contribution > 0
              (asserts! (> donor-contribution u0) ERR_NO_CONTRIBUTION)
              ;; Check: Donor hasn't voted on this milestone
              (asserts! (not (default-to false (map-get? has-voted {project-id: project-id, milestone-id: current-milestone-id, donor: tx-sender}))) ERR_ALREADY_VOTED)
              ;; Check: Contract is not paused
              (asserts! (check-not-paused) ERR_CONTRACT_PAUSED)
              ;; Snapshot Logic: Capture total donations at vote start (first vote only)
              ;; If snapshot doesn't exist (is none), this is the first vote
              (let ((existing-snapshot (map-get? milestone-snapshot-donations {project-id: project-id, milestone-id: current-milestone-id})))
                (if (is-none existing-snapshot)
                  (let ((total-donations (default-to u0 (map-get? total-project-donations project-id))))
                    (map-set milestone-snapshot-donations {project-id: project-id, milestone-id: current-milestone-id} total-donations)
                  )
                  true ;; This is the required 3rd argument (the 'else' branch)
                )
              )
              ;; Calculate vote weight from donor contributions
              (let ((vote-weight donor-contribution))
                ;; Update milestone's vote-weight
                (let ((current-vote-weight (get vote-weight milestone)))
                  (map-set milestones {project-id: project-id, milestone-id: current-milestone-id} (merge milestone {
                    vote-weight: (+ current-vote-weight vote-weight)
                  }))
                )
                ;; Set has-voted map entry
                (map-set has-voted {project-id: project-id, milestone-id: current-milestone-id, donor: tx-sender} true)
                (ok vote-weight)
              )
            )
          )
        )
      )
    )
  )
)

;; =============================================================
;;                      FUND RELEASE
;; =============================================================

;; Release funds for the current milestone
;; @param project-id: The ID of the project to release funds for
;; @param token-trait: SIP-010 trait reference (required for token projects, can be any trait for STX projects)
;; @return: (ok amount-released) on success
;; @dev Only the project's NGO can release funds. Requires >50% quorum from donors.
;;      Transfers funds (STX or SIP-010 token) to NGO.
;;      Marks project as completed if this is the final milestone.
(define-public (release-funds
  (project-id uint)
  (token-trait <sip-010-trait>)
)
  (let ((project (unwrap! (map-get? projects project-id) ERR_PROJECT_NOT_FOUND)))
    (let ((current-milestone-id (get current-milestone project)))
      (let ((milestone-count (unwrap! (map-get? project-milestone-count project-id) ERR_NO_CURRENT_MILESTONE)))
        (let ((milestone (unwrap! (map-get? milestones {project-id: project-id, milestone-id: current-milestone-id}) ERR_NO_CURRENT_MILESTONE)))
          (let ((amount-requested (get amount-requested milestone)))
            (begin
              (asserts! (is-eq tx-sender (get ngo project)) ERR_NOT_PROJECT_NGO)
              (asserts! (< current-milestone-id milestone-count) ERR_NO_CURRENT_MILESTONE)
              (asserts! (not (get approved milestone)) ERR_MILESTONE_ALREADY_APPROVED)
              (asserts! (not (get funds-released milestone)) ERR_MILESTONE_ALREADY_RELEASED)
              
              (let ((snapshot (unwrap! (map-get? milestone-snapshot-donations {project-id: project-id, milestone-id: current-milestone-id}) ERR_QUORUM_NOT_MET)))
                (let ((vote-weight (get vote-weight milestone)))
                  (asserts! (> (* vote-weight u100) (* snapshot u50)) ERR_QUORUM_NOT_MET)
                  (asserts! (>= (get balance project) amount-requested) ERR_INSUFFICIENT_PROJECT_BALANCE)
                  (asserts! (check-not-paused) ERR_CONTRACT_PAUSED)
                  
                  ;; Update State
                  (map-set milestones {project-id: project-id, milestone-id: current-milestone-id} (merge milestone { approved: true, funds-released: true }))
                  
                  (let ((new-balance (- (get balance project) amount-requested))
                        (new-current-milestone (+ current-milestone-id u1))
                        (is-final-milestone (is-eq (+ current-milestone-id u1) milestone-count)))
                    
                    (map-set projects project-id (merge project {
                      balance: new-balance,
                      current-milestone: new-current-milestone,
                      is-completed: is-final-milestone,
                      is-active: (not is-final-milestone)
                    }))
                    
                    ;; Transfer funds: STX or SIP-010 token
                    (match (get donation-token project) token-principal
                      ;; SIP-010 token transfer (if 'some')
                      (begin
                        ;; Validate that passed trait matches stored token principal
                        (asserts! (is-eq (contract-of token-trait) token-principal) ERR_INVALID_DONATION_TOKEN)
                        (unwrap! (as-contract? ((with-all-assets-unsafe))
                          (unwrap! (contract-call? token-trait transfer amount-requested current-contract (get ngo project) none) ERR_INVALID_DONATION_TOKEN)
                        ) ERR_INVALID_DONATION_TOKEN)
                        true
                      )
                      ;; STX transfer (if 'none')
                      (begin
                        (unwrap! (as-contract? ((with-stx amount-requested))
                          (unwrap! (stx-transfer? amount-requested current-contract (get ngo project)) ERR_INVALID_DONATION_TOKEN)
                        ) ERR_INVALID_DONATION_TOKEN)
                        true
                      )
                    )
                    (ok amount-requested)
                  )
                )
              )
            )
          )
        )
      )
    )
  )
)


;; =============================================================
;;                  EMERGENCY CONTROLS
;; =============================================================

;; Emergency withdrawal of funds from a project (only when paused)
;; @param project-id: The ID of the project to withdraw funds from
;; @param token-trait: SIP-010 trait reference (required for token projects, can be any trait for STX projects)
;; @return: (ok amount-withdrawn) on success
;; @dev Only owner can withdraw. Only works when contract is paused.
;;      Withdraws all remaining balance from the project to the owner.
;;      This is a last resort for stuck funds.
(define-public (emergency-withdraw
  (project-id uint)
  (token-trait <sip-010-trait>)
)
  (let ((project (unwrap! (map-get? projects project-id) ERR_PROJECT_NOT_FOUND)))
    (let ((project-balance (get balance project)))
      (begin
        ;; Check: Owner only
        (asserts! (is-owner?) ERR_UNAUTHORIZED)
        ;; Check: Contract is paused
        (asserts! (var-get contract-paused) ERR_CONTRACT_PAUSED)
        ;; Check: Project exists (already checked via unwrap!)
        ;; Set project balance to 0
        (map-set projects project-id (merge project {
          balance: u0
        }))
        ;; Withdraw all remaining balance: STX or SIP-010 token
        (let ((donation-token (get donation-token project)))
          (match donation-token token-principal
            ;; SIP-010 token transfer (if 'some')
            (begin
              ;; Validate that passed trait matches stored token principal
              (asserts! (is-eq (contract-of token-trait) token-principal) ERR_INVALID_DONATION_TOKEN)
              (unwrap! (as-contract? ((with-all-assets-unsafe))
                (unwrap! (contract-call? token-trait transfer project-balance current-contract CONTRACT_OWNER none) ERR_INVALID_DONATION_TOKEN)
              ) ERR_INVALID_DONATION_TOKEN)
              true
            )
            ;; STX transfer (if 'none')
            (begin
              (unwrap! (as-contract? ((with-stx project-balance))
                (unwrap! (stx-transfer? project-balance current-contract CONTRACT_OWNER) ERR_INVALID_DONATION_TOKEN)
              ) ERR_INVALID_DONATION_TOKEN)
              true
            )
          )
        )
        (ok project-balance)
      )
    )
  )
)

;; =============================================================
;;                  READ-ONLY FUNCTIONS
;; =============================================================

;; =============================================================
;;                  PROJECT QUERIES
;; =============================================================

;; Get project information
;; @param project-id: The ID of the project
;; @return: The Project struct containing all project data, or none if not found
(define-read-only (get-project (project-id uint))
  (map-get? projects project-id)
)

;; Get the total number of milestones for a project
;; @param project-id: The ID of the project
;; @return: The number of milestones, or none if project not found
(define-read-only (get-project-milestone-count (project-id uint))
  (map-get? project-milestone-count project-id)
)

;; Get the project counter (total number of projects created)
;; @return: The current project counter value
(define-read-only (get-project-counter)
  (var-get project-counter)
)

;; =============================================================
;;                  MILESTONE QUERIES
;; =============================================================

;; Get milestone information
;; @param project-id: The ID of the project
;; @param milestone-id: The ID of the milestone
;; @return: The Milestone struct containing all milestone data, or none if not found
(define-read-only (get-milestone (project-id uint) (milestone-id uint))
  (map-get? milestones {project-id: project-id, milestone-id: milestone-id})
)

;; Get the current milestone for a project
;; @param project-id: The ID of the project
;; @return: The current Milestone struct, or none if project/milestone not found
(define-read-only (get-current-milestone (project-id uint))
  (let ((project (map-get? projects project-id)))
    (match project proj
      (let ((current-milestone-id (get current-milestone proj)))
        (map-get? milestones {project-id: project-id, milestone-id: current-milestone-id})
      )
      none
    )
  )
)

;; =============================================================
;;                  DONATION QUERIES
;; =============================================================

;; Get a donor's total contribution to a project
;; @param project-id: The ID of the project
;; @param donor: The principal address of the donor
;; @return: The total amount contributed by the donor (0 if no contribution)
(define-read-only (get-donor-contribution (project-id uint) (donor principal))
  (default-to u0 (map-get? donor-contributions {project-id: project-id, donor: donor}))
)

;; Get the total donations received for a project
;; @param project-id: The ID of the project
;; @return: The total donations amount (0 if project not found)
(define-read-only (get-total-project-donations (project-id uint))
  (default-to u0 (map-get? total-project-donations project-id))
)

;; Check if a donor has voted on a specific milestone
;; @param project-id: The ID of the project
;; @param milestone-id: The ID of the milestone
;; @param donor: The principal address of the donor
;; @return: True if the donor has voted, false otherwise
(define-read-only (has-donor-voted (project-id uint) (milestone-id uint) (donor principal))
  (default-to false (map-get? has-voted {project-id: project-id, milestone-id: milestone-id, donor: donor}))
)

;; =============================================================
;;                  VOTING STATUS
;; =============================================================

;; Get voting status for a milestone
;; @param project-id: The ID of the project
;; @param milestone-id: The ID of the milestone
;; @return: A tuple containing:
;;   - vote-weight: The total vote weight for this milestone
;;   - snapshot: The donation snapshot at vote start
;;   - can-release: True if quorum is met and balance is sufficient for release
;;   Returns none if milestone not found
(define-read-only (get-milestone-vote-status (project-id uint) (milestone-id uint))
  (let ((milestone (map-get? milestones {project-id: project-id, milestone-id: milestone-id})))
    (match milestone ms
      (let ((vote-weight (get vote-weight ms))
            (amount-requested (get amount-requested ms))
            (snapshot (default-to u0 (map-get? milestone-snapshot-donations {project-id: project-id, milestone-id: milestone-id}))))
        (let ((project (map-get? projects project-id)))
          (match project proj
            (let ((balance (get balance proj)))
              ;; can-release = (voteWeight > 50% of snapshot) && (balance >= amountRequested)
              (let ((quorum-met (and (> snapshot u0) (> (* vote-weight u100) (* snapshot u50))))
                    (sufficient-balance (>= balance amount-requested)))
                (some (ok {
                  vote-weight: vote-weight,
                  snapshot: snapshot,
                  can-release: (and quorum-met sufficient-balance)
                }))
              )
            )
            (some (ok {
              vote-weight: vote-weight,
              snapshot: snapshot,
              can-release: false
            }))
          )
        )
      )
      none
    )
  )
)
