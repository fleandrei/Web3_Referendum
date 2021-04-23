# Web3 Direct Democracy

##Context
Our society knows a crisis of confidence that increases year after year. All institutions are concerned : mass media, banks, trade unions, associations, politicians …
This phenomenon has been expressed via various movements such as occupy Wall street or Yellow Vest and can be seen by the rise of abstentions. 
In this context new forms of democracy and governance could emerge. Direct democracy could increase citizens involvment in political life by allowing them to take part directly in law editing and by removing or reducing the need of intermediary (Representative democracy).

##Concept:
Web3 Direct Democracy is an Ethereum blockchain school project whose goal is to provide a governance system implementing a direct democracy protocol coupled with a representative one. This DAO is developed in order to be used for both onchain and/or offchain use cases. In oder words, democratic process implemented by the solution can lead to 2 differents kind of results:

* The edition of written laws : charters, internals rules, assembly decisions…
* The execution of an onchain function.

A Web3 Direct Democracy project can be deployed and used by various entities such as municipalities, ONG, companies, DAO…
Governance rules are customizable and updatable via a democratic process.

Notice : The solidity code has been unit tested but not audited for securities issues.

##Global design:

Almost all contracts of the project can be divided into two categories: __Register contract__ and __Governance contract__.

###Register contracts
These contracts inherit from Register abstract contract and contains the logic and the data that are ruled via Web3 Direct Democracy democratic process. Functions that allow to edit Register contract state and to execute it’s logic are named _Register_Functions_. These functions can only be called by a list of allowed address registered in the _Register_Authorities_ array (Register_Authorities_Only). These authorities can be any accounts you want but it’s preferred to use _Governance contract_ (see next sub section) instead. 


###Governance contracts
« Governance contract » appellation isn’t related to any Web3 Direct Democracy contract name. We just use this appellation to talk about contracts that have the right to govern one or more Register Contract (if their address belongs to register contract _Register_Authorities_). Citizens are not allowed to directly call Register_Functions. They have to use Governance contracts if they want to interact with register contracts. 
 There are two kind of Governance contracts : Agora (Direct democracy) and Delegation (Representative democracy).
These contract implement two different still very similar democratic process that lead to the elaboration and the vote of a law project. A law project contains :

* Title : It can be a hash.
* Description : It’s a text that explain the spirit and generals goals of the law project. It can be a hash.
* Function call Corpus : It’s an ordered list of encoded function calls (function selector + encoded parameters) corresponding to a register contract’s Register_Functions. When the law project is adopted, all function calls of the corpus are executed by Governance contract in the order of which they are registered in the list.

##Registers :
In this section, we will talk about the four kind of Register contracts that can be used.

###Constitution
Constitution register contract is used to edit parameters of a Web3 Direct Democracy project. It contains address of all deployed contracts used in a project. Particularly, it contains a list of address of all register contracts that are used in the project, and another list for all Delegations. Hence, Constitution is the central contract in a project. To launch a Web3 Direct Democracy project, we have to launch the Constitution contract. From Constitution deployed contract, we can have access to all the project. There is a single Constitution contract in a project.
With Constitution register contract, we can add new register and delegations to the project, we can modify their democratic process parameters, change other register’s _Register_Authorities_ array…

Constitution contract goal is to customize the project to specific use cases and to keep it updatable. 

###Loi
The _Loi_ contract is used to edit written laws. The structure of a law is similar to Governance contract law project one :

* Title
* Description
* Article List : It’s a list of timestamped items containing a title and a short text. Theses articles goal is to precisely express the law.

Register function allow to add new laws, to add articles to existing laws, to remove laws, to remove articles from existing laws and to change the description of an existing law.
You can have multiple Loi contracts in your project, each being ruled by different Governance contract and/or via different democratic process parameters. For example you could use two Loi contracts with one handling more critical law than the other. Hence the first one should be ruled via a more secure parametrized democratic process (that least more time, with more citizen control...) than the other one. 

###API_Register : 
The API_Register contract is used to call functions of third-party contracts via a democratic process. These third-party contracts functions can for example be used to execute critic task such as sending an important transaction, transferring a large amount of ether... 
They should only be callable by API_Register contract. 

API_Register contract contains an editable list of controllable third contract address with their callable functions. Each controllable smart contract is represented by a structure containing :

* Title
* Address
* Description
* List of callable functions : Callable functions are represented by their function selector.

You can have multiple API_Register contracts in your project, each being ruled by different Governance contract and/or via different democratic process parameters. For example you could use two API_Register contracts with one handling more complicated third party contract functionality than the other. Hence the first one could be ruled by a Delegation contract (see later in the _Governance contract_ section) whose members have technical skills whereas the other one could be ruled directly by citizens via Agora contract (see later in the _Governance contract_ section).

Note : API_Register can neither deploy a contract nor transfer ether.

###Citizens_Register : 
The Citizens_Register contract is used to edit the list of citizens accounts i.e. accounts that are allowed to take part in politicals activities of the DAO. 

Inherited _Register_Authorities_ list is not used in this contract. Instead, there are two different authorities lists : _Citizens_Registering_Authorities_ and _Citizens_Banning_Authorities_. 
The first one contains Governance contract address allowed to register new citizens in the citizen list and to update additional data about existing ones. 
The second one contains Governance contracts address allowed to ban citizens that have a bad behaviour. These contracts could implement a trial logic that allows to judge and convict bad citizens. 
Citizens can be ban for a limited or unlimited amount of time and can be granted pardon before the end of their banishment by  _Citizens_Banning_Authorities_.
Citizens who committed very prejudicial actions can also be banned forever (blacklisted).

Citizens_Register contract is unique in a project. As it has to be deployed before the Constitution contract (Constitution constructor takes it’s address as parameter), the migration script should set it’s _Constitution_Address_ field via the _Set_Constitution_ function after the Constitution is deployed.


##Governance contract:

###DemoCoin
Each Web3 Direct Democracy project uses an ERC20 utility token named _DemoCoin_. It’s address is contained in the Constitution contract. DemoCoin contains two authorities lists editable by the Constitution : _Mint_Authorities_ and _Burn_Authorities_.
Address of the first one are allowed to mint tokens and transfer it to accounts whereas address of the second one are allowed to burn tokens from accounts. These authorities should be Governance contracts. When a new account is registered as citizen of the project, he a certain amount of token is minted for him. Hence, the Citizen_Register contract address should be added in the _Mint_Authorities_ array.
As DemoCoin contract has to be deployed before the Constitution contract (Constitution constructor takes its address as parameter), the migration script should set it’s _Constitution_Address_ field via the _Set_Constitution_ function after the Constitution is deployed.

DemoCoin token has several goals:

* __Avoiding the proliferation of proposals__: In each Governance Contract, citizens have to spend DemoCoin tokens to take part in the law project elaboration process. They have to spend a certain amount of tokens (not necessarily their own) to submit new law project or new propositions for the proposal_corpus of already existing law project. This allows to avoid proliferation of proposals, it increases the readability of law projects and force citizens to structure and optimize their propositions.
* __Incentive citizens to vote (in Agora)__ : All tokens that have been spent during law project elaboration stage are redistributed to all citizens that have voted during the voting stage.
* __Incentive Delegation members to vote popular law project__ : If a Delegation created law project is rejected by citizens, the delegation have to pay penalty fee (See the _Delegation_ sub-section).

###Agora :
In the ancient Greece the Agora was the public place where the population used to gather and which  was the center of social, economic and political life of the city. Etymologically, Agora means « gathering place », « Assembly ». 
In a Web3 Direct Democracy project, the Agora is the contract used to implement direct democracy via a legislative referendum of people initiative. This process is divided in three stages :

* __Referendum proposition elaboration and signing__ : Every citizen can submit a new referendum proposition (Title + Description) and/or take part in the elaboration of the Function call Corpus of an already submitted referendum proposition by submitting a list of function call. These operations cost DemoCoin token. These fees are transferred to Agora address.
We get a list of several Function call Corpus proposals. This list is named the Proposal Corpus. 
In parallel, during this stage, every citizen can sign the petition to submit the referendum proposition as a referendum to all citizens.
* __Voting__ : If the referendum proposition gets enough signatures, then all citizens can vote for the function call corpus they prefer in the Proposal Corpus. Else, the Referendum proposition is rejected. If the blank vote is majority, then the Referendum proposition is rejected.
* __Execution__ : Once a winning proposal has been voted, we still have to execute it’s function call list. Every citizen has the right to execute one or more function call via the _Execute_Winning_Proposal_ function. 

Once all function calls of a law proposition have been executed, all accounts that have voted can get their DemoCoin token reward from Agora via the _Get_Voter_Reward_ function. These rewards come from all fees that have been paid during the elaboration stage.
Agora contract is unique in a project and it has authority on all register contracts. Referendum of people initiative process parameters are specific to each register contract and are edited by the Constitution contract. There are seven of them :

* __Petition_Duration__ : Duration of the referendum proposition elaboration stage
* __Vote_Duration__ : Duration of the voting stage
* __Vote_Checking_Duration__ : Duration of the validation stage (see Vote sub-section)
* __Law_Initialisation_Price__ : Amount of DemoCoin token to pay to submit a new Referendum proposition.
* __FunctionCall_Price__ : Amount of DemoCoin token to pay for each new function call of a function call corpus proposal submission.
* __Required_Petition_Rate__ : The minimum ratio of citizens signatures required to submit the referendum proposition as a referendum to all citizens.
* __Ivote_address__ : Address of the IVote contract used in the voting and validation stage (see later in the Vote sub-section)


As Agora contract has to be deployed before the Constitution contract (Constitution constructor takes its address as parameter), the migration script should set it’s _Constitution_Address_ field via the _Set_Constitution_ function after the Constitution is deployed.

###Delegation :

Delegations contracts implement representative democracy. A project can have multiple Delegations contracts. The Constitution contract can create new Delegation contracts or add already deployed ones to its Delegation list. All Delegations have to inherit from IDelegation interface but they can be customized to fulfill specific use case.
A Delegation contains a list of members voted by citizens. 

####Law creation :
Delegation members are allowed to elaborate and vote law project. This process can be divided in four stages :

* __Proposition stage__ : Delegation members elaborate the law project in the same way as in Agora. Like in Agora, this operation cost token. The difference here is that Delegation members don’t spend their own token. Instead, they use Delegation’s token that are placed in escrow (on the Delegation Contract). 
* __Voting__ : Delegation members vote for the function call corpus proposal they prefer in the Proposal Corpus. If the blank vote is majority, then the law project is abandoned.
* __Censoring__ : Once a winning proposal has been voted, citizens have a certain amount of time to reject this new law project if it doesn’t match their expectation and opinion. To do that, they have to sign an abrogation petition. If it gets enough signatures, the law is rejected ( abrogatory referendum of people initiative) and the Delegation has to pay a penalty fee proportional to the amount of token that have been placed in escrow during the Proposition stage. These fees are transferred to Agora that will redistribute them to voters at the next referendum.
During the Proposition stage Delegation contract should ensure that it has enough funds to afford potential penalty fees.
* __Execution__ : If the law project isn’t rejected, then all function call of the winning proposal have to be executed  in the same way as in the Agora.

Delegation law creation process’s parameters are edited by Constitution contract. There are nine of them :

* __Member_Max_Token_Usage__ : The maximum amount of token a member is allowed to use for a specific law project elaboration. This allows to avoid that a single delegation member consumes all Delegation’s tokens.
* __Law_Initialisation_Price__ : Amount of DemoCoin token to pay to submit a new Referendum proposition.
* __FunctionCall_Price__ : Amount of DemoCoin token to pay for each new function call of a function call corpus proposal submission.
* __Proposition_Duration__ : Duration of the Proposition stage
* __Vote_Duration__ : Duration of the voting stage
* __Law_Censor_Period_Duration__: Duration of the Censoring stage
* __Censor_Proposition_Petition_Rate__ : The minimum ratio of citizens signatures required to censor a law project
* __Censor_Penalty_Rate__ : The ratio of tokens placed in escrow during the law project elaboration stage that will be paid as penalties fees to Agora.
* __Ivote_address__ : Address of the IVote contract used in the voting stage (see later in the Vote sub-section)


####Delegation members :


Delegation members mandate is limited in time. Then there is a new election. Every citizen can candidate to be a delegation member. If there are less candidats than the maximum number of members in the Delegation, then all candidats become members without any election.
Delegation mandate can be interrupted by a recall referendum of people initiative : Citizens can sign a petition to revoke members. If the petition gets enough signatures, then a new election begins.

Parameters that rule the mandate of a Delegation are edited by the Constitution contract. There are six of them :

* __Election_Duration__: Duration of the election stage. If the blank vote is majority, then the election is canceled and we keep current delegation member in place.
* __Validation_Duration__: Duration of the validation stage (see later in the Vote sub-section)
* __Mandate_Duration__ : Duration of a Mandate.
* __Immunity_Duration__: Amount of time after the beginning of a new mandate during which delegation's members can't be revoked
* __Next_Mandate_Max_Members__ : Maximum number of members in the delegation.
* __New_Election_Petition_Rate__ : The minimum ratio of citizens required to revoke the current delegation's members and start a new election.
* __Ivote_address__ : Address of the IVote contract used in the Election and Validation stage (see later in the Vote sub-section)

###Proposal Tree:
In both Agora and Delegation Governance contract, law project are elaborated the same way : Every citizen can submit one or more proposal for the function call corpus of the law project. Proposals are stored in a _Proposal Tree_ where each proposal can reuse function calls of its parent proposal.
When a citizen wants to submit a proposal via the _Add_Proposal_ function, he has to pay tokens for each new function call but function calls that come from the parent proposal are free. Hence, citizens can spare tokens by reusing already proposed function call. This is an incentive for citizens to avoid duplicate or unnecessary function call. 
The tree structure increases the readability of the proposal corpus as similar proposal would have the same parents.
Once a citizen has submitted a proposal, he still has the possibility to insert new function call to it via the _Add_Item_ function.

###Vote :
####IVote Contracts :
The voting in Agora and Delegation democratic process is realised in an IVote contract. IVote is an interface from which users can implement customized voting process. An IVote can handle multiple voting session for several contracts. For each voting session, we have to specify the number of candidats propositions N and the number of propositions that can be adopted M (M<N). For example, in the voting stage of Agora M is 1 (we want to keep only one proposal) and N is the number of proposals in the proposal corpus. In the election stage of Delegation, M is the maximum number of members and N is the number of candidats. Propositions are numerated from 1 to N. Proposition 0 correspond to blank vote. 
If there is a need to keep votes secrets until the voting stage is over, voter can submit the hash of their vote. Then during a validation stage, voter would have to validate their hashed vote by submitting their clear vote with the bytes32 salt they used to hash it. 

####Majority_Judgment_Ballot :
An example of IVote implementation is the Majority_Judgment_Ballot contract that implement a Majority Judgment ballot (See https://www.oca.eu/images/LAGRANGE/seminaires/2018/2018-12-12_Laraki_eng.pdf).  Majority Judgment is a ballot process proven to be able to avoid biases of classical Uninominal ballot such as strategic vote. In Majority Judgment ballot, citizens assess each candidat and give it a grade. In our implementation, each candidat proposition can be assessed as « Reject », « Bad », « Neutral », « Good » and « Excelent ». For each candidat proposition, citizens assessment are sorted from best grades to worst ones (from « Excelent » to « Reject »). The majority grade of a proposition corresponds to it’s median grade. If the majority grade of a candidat proposition is « Good », it means that 50 % of citizens think that this proposition is « Good » or Better. 
Winning propositions are the M candidats propositions that have the best Majority grade.
If the most popular proposition is the blank vote, then we ignore the other M-1 winning propositions.

##Installation and execution

###Installation :

Install Openzeppelin libraries :

`$ npm install @openzeppelin/contract-loader`

`$ npm install @openzeppelin/contracts`

`$ npm install @openzeppelin/test-helpers`


Install javascript packages :

`$ npm install dotenv`

`$ npm install @truffle/hdwallet-provider`

###Migration Parameters:
The migration folder contains a _Migration_Parameters.json_ file that set parameters for the deployment of initials contracts : DemoCoin, Citizens_Register, Agora and Constitution.
It’s a JSON file containing following fields :

* __DemoCoin__ : JSON object containing parameters related to DemoCoin contract deployment
	* Name : Name of the DemoCoin ERC20
	* Symbol : Symbol of the DemoCoin ERC20
	* Initial_Owners : Array address of initials DemoCoin  owner accounts 
	* Initial_Amount : Array of initials token amount contained by initials owner accounts. This 	array must have the same size as Initial_Owner
* __Citizens_Register__ : JSON object containing parameters related to Citizen_Register contract deployment
	* Name : Name of the Citizens_Register contract
	* Initial_Citizens : Array of initials citizens accounts. Should contain the same accounts as 	DemoCoin’s Initial_Owner field.
	* new_citizen_mint_amount : Amount of token to transfer to a new registered citizen.
* __Agora_Name__ : Name of the Agora contract.
* __Constitution__ : JSON object containing parameters related to Constitution contract deployment
	* Name : Name of the Constitution contract
	* transition_government : Address of the transition_government account. (see next sub-section)


You can edit this file according to your needs.

###Web3 direct democracy project initialisation: 
Once a Web3 Direct Democracy project has just been deployed, it hasn’t any register or delegation. Citizens_Register and DemoCoin contracts haven’t any authority in their _Register_Authorities_ list. 
Thus, at the beginning of a Web3 Direct Democracy project, we need an initialisation stage. In this initialisation stage, there is a _Transitional_Government_ account that has authority on the constitution and can quickly perform necessary operations without passing by any democratic process :

* Add Constitution register to _Registers_Address_List_
* Add some other registers to _Registers_Address_List_
* Add some Delegations to _Delegation_Address_List_
* Set Delegations authority on one or more registers: Add the register’s address to Delegations’s controlled register list (via _Add_Delegation_Controled_Register_ Constitution function) and add the Delegation’s address to the _Register_Authorities_ array of the corresponding register (via _Add_Register_Authority_ Constitution function).
* Add Citizens_Register to the _Mint_Authorities_ of the DemoCoin contract
* Add a Governance contract (A Delegation would be better) to Citizens_Registering_Authorities of the Citizens_Register contract
* …

At the end of this initialisation stage, Transitionsal_Government has to remove himself from Constitution contract _Register_Authorities_ list via the _End_Transition_Government_ function.

