// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;


/*pragma solidity >=0.6.0 <0.8.0;*/
import "contracts/IVote.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";



contract Majority_Judgment_Ballot is IVote{
    using SafeMath for uint; 
    
    enum Assessement{
        EXCELENT,
        GOOD,
        NEUTRAL,
        BAD,
        REJECT
        /*Reject,
        BAD,
        NEUTRAL,
        GOOD,
        EXCELENT*/
    }
    
    enum Ballot_Status{
        NON_CREATED,
        VOTE,
        VOTE_VALIDATION,
        FINISHED
    }
    
    struct Voter{
        bool Voted;
        bool Validated;
        bytes32 Choice;
    }
    
    struct Propositions_Result{
        uint[5] Cumulated_Score;
        Assessement Median_Grade;
    }
    
    struct Ballot{
        address Voters_Register_Address;
        bytes4 Check_Voter_Selector;
        Ballot_Status Status;
        uint Creation_Timestamp;
        uint End_Vote_Timestamp;
        uint Vote_Duration;
        uint Vote_Validation_Duration;
        uint Propositions_Number;  
        uint Max_Winning_Propositions_Number;
        uint Voter_Number;
        //mapping(uint=>uint[]) Propositions_By_Grades;
        uint[] Winning_Propositions;
        mapping(address=>Voter) Voters;
        //mapping(uint=>uint[5]) Proposition_Cumulated_Score;
        mapping(uint=>Propositions_Result) Propositions_Results; //From 0 to Propositions_Number. If the 0 proposition get the first place, the oder propositions are rejected.
    }
    
    event Ballot_Created(bytes32 key);
    event Voted_Clear(bytes32 key, address voter);
    event Voted_Hashed(bytes32 key, address voter);
    event Begin_Validation(bytes32 key);
    event Validated_Vote(bytes32 key, address voter);
    event Vote_Finished(bytes32 key);
    
    mapping(bytes32=>Ballot) public Ballots;
    
    
    function Create_Ballot(bytes32 key, address Voters_Register_Address, bytes4 Check_Voter_Selector, uint Vote_Duration, uint Vote_Validation_Duration, uint Propositions_Number, uint Max_Winning_Propositions_Number) external override {
        require(Ballots[key].Creation_Timestamp == 0, "Already Existing Ballot");
        //if(Voters_Register_Address==address(0) || Check_Voter_Selector==bytes4(0) || Vote_Duration==0 || Propositions_Number.sub(Max_Winning_Propositions_Number) == 0 || Max_Winning_Propositions_Number==0 ){
        if(Voters_Register_Address==address(0) || Check_Voter_Selector==bytes4(0) || Vote_Duration==0 || Max_Winning_Propositions_Number==0 ){
            revert("Bad Argument Values");
        }
        
        if(Propositions_Number==1){
            require(Max_Winning_Propositions_Number==1, "Argument Inconsistency");
            
        }else{
            require(Propositions_Number>Max_Winning_Propositions_Number, "Argument Inconsistency");
        }
        
        Ballots[key].Voters_Register_Address =Voters_Register_Address;
        Ballots[key].Check_Voter_Selector = Check_Voter_Selector;
        Ballots[key].Vote_Duration = Vote_Duration;
        Ballots[key].Vote_Validation_Duration = Vote_Validation_Duration;
        Ballots[key].Propositions_Number = Propositions_Number;
        Ballots[key].Max_Winning_Propositions_Number = Max_Winning_Propositions_Number;
        
        Ballots[key].Creation_Timestamp =block.timestamp;
        Ballots[key].Status = Ballot_Status.VOTE;

        emit Ballot_Created(key);
    }
        
    
    function Vote_Clear(bytes32 key, uint[] calldata Choices) external override{
        //require(Ballots[key].Vote_Duration > block.timestamp.sub(Ballots[key].Creation_Timestamp), "Voting is over");
        require(Ballots[key].Status == Ballot_Status.VOTE, "Not at voting stage");
        require(!Ballots[key].Voters[msg.sender].Voted, "Already Voted");
        require(Check_Voter_Address(key, msg.sender), "Address Not Allowed");
        require(Ballots[key].Vote_Validation_Duration == 0, "Should Use Vote_Hashed");
        uint choice_len = Choices.length ;
        require(Ballots[key].Propositions_Number.add(1) == choice_len, "Choices argument wrong size");
        
        Ballots[key].Voter_Number = Ballots[key].Voter_Number.add(1);
        
    
        Ballots[key].Voters[msg.sender].Voted = true;
        for(uint i=0; i< choice_len; i++){
            for(uint j=Choices[i]; j<5; j++){
                Ballots[key].Propositions_Results[i].Cumulated_Score[j]++;
                //Ballots[key].Proposition_Cumulated_Score[i][j]++;
            }
        }
        emit Voted_Clear(key, msg.sender);
    }
    
    function Vote_Hashed(bytes32 key, bytes32 Choice) external override{
        //require(Ballots[key].Vote_Duration > block.timestamp.sub(Ballots[key].Creation_Timestamp), "Voting is over");
        require(Ballots[key].Status == Ballot_Status.VOTE, "Not at voting stage");
        require(!Ballots[key].Voters[msg.sender].Voted, "Already Voted");
        require(Check_Voter_Address(key, msg.sender), "Address Not Allowed");
        require(Ballots[key].Vote_Validation_Duration > 0, "Should Use Vote_Clear");
        //require(Ballots[key].Propositions_Number.add(1) == choice_len);
        
        Ballots[key].Voters[msg.sender].Voted = true;
        Ballots[key].Voters[msg.sender].Choice = Choice;
        
        emit Voted_Hashed( key, msg.sender);
    }
    
    function End_Vote(bytes32 key)external override{
        require(Ballots[key].Status==Ballot_Status.VOTE, "Not at voting stage");
        require(Ballots[key].Vote_Duration < block.timestamp.sub(Ballots[key].Creation_Timestamp), "Voting stage not finished");
        if(Ballots[key].Vote_Validation_Duration>0){
            Ballots[key].Status = Ballot_Status.VOTE_VALIDATION;
            emit Begin_Validation(key);
        }else{
            _Talling_Votes(key);
            Ballots[key].Status = Ballot_Status.FINISHED;
            emit Vote_Finished(key);
        }
        Ballots[key].End_Vote_Timestamp = block.timestamp;
        
    }
    
    function Valdiate_Vote(bytes32 key, uint[] calldata Choices, bytes32 salt )external override {
        require(Ballots[key].Status==Ballot_Status.VOTE_VALIDATION, "Not at vote validation stage");
        //require(Check_Voter_Address(key, msg.sender), "Address Not Allowed");
        require(!Ballots[key].Voters[msg.sender].Validated, "Vote Already Validated");
        uint choice_len = Choices.length ;
        require(Ballots[key].Propositions_Number.add(1) == choice_len, "Choices argument wrong size");
        
        bytes32 hash = keccak256(abi.encode(Choices, salt));
        require(hash==Ballots[key].Voters[msg.sender].Choice, "Hashes don't match");
        
        Ballots[key].Voters[msg.sender].Validated = true;
        Ballots[key].Voter_Number = Ballots[key].Voter_Number.add(1);
        
        for(uint i=0; i<Choices.length; i++){
            for(uint j=Choices[i]; j<5; j++){
                Ballots[key].Propositions_Results[i].Cumulated_Score[j]++;
                //Ballots[key].Proposition_Cumulated_Score[i][j]++;
            }
        }
        emit Validated_Vote(key, msg.sender);
    }
    
    
    function End_Validation_Vote(bytes32 key) external override{
        require( (Ballots[key].Status == Ballot_Status.VOTE_VALIDATION && Ballots[key].Vote_Validation_Duration < block.timestamp.sub(Ballots[key].End_Vote_Timestamp)), "Not at vote counting stage");
        _Talling_Votes(key);
        Ballots[key].Status = Ballot_Status.FINISHED;
        emit Vote_Finished(key);
        
    }
    

    function _Talling_Votes(bytes32 key) internal{
        uint number_propositions = Ballots[key].Propositions_Number;
        uint half_voters = Ballots[key].Voter_Number.div(2) +  Ballots[key].Voter_Number.mod(2);
        uint winning_propositions_number = Ballots[key].Max_Winning_Propositions_Number;
        //uint[][2] memory winning_propositions = new uint[][2](winning_propositions_number+1);
        uint[] memory winning_propositions = new uint[](winning_propositions_number+1);
        uint[] memory winning_propositions_grades = new uint[](winning_propositions_number+1);
        uint mention;
        uint rank;
        uint winning_list_size;
        bool continu;
        uint Temp_prop;
        //uint counter;
        //uint Temp_mention;
        
        //Assessement of each proposition
        for(uint prop=0; prop<=number_propositions; prop++){
            while(Ballots[key].Propositions_Results[prop].Cumulated_Score[mention]<half_voters){
            //while(Ballots[key].Proposition_Cumulated_Score[prop][mention]<half_voters){
                mention++;
            }
            Ballots[key].Propositions_Results[prop].Median_Grade = Assessement(mention);
            //Ballots[key].Propositions_By_Grades[mention].push(prop);
            
         
         //Fetching the "winning_propositions_number" winning propositions.
            continu=true;
            while(continu && rank<winning_list_size){
                if(winning_propositions_grades[rank]<mention || (winning_propositions_grades[rank]==mention && Order_Proposition_Result(key,  winning_propositions[rank], prop, mention)!=prop)){
                    rank++;
                }else{
                    continu=false;
                }
            }
                
            if(winning_list_size<winning_propositions_number+1){
                winning_list_size++;
            }
            
            Temp_prop=prop;
            while(rank<winning_list_size){
                if(rank+1<winning_list_size){
                    (winning_propositions[rank], Temp_prop) = (Temp_prop, winning_propositions[rank]);
                    (winning_propositions_grades[rank], mention) = (mention, winning_propositions_grades[rank]);
                    rank++;
                }else{
                    winning_propositions[rank]=Temp_prop;
                    winning_propositions_grades[rank]=mention;
                    rank = winning_list_size;
                }
            }
                
            rank=0; 
            mention=0;
        }
            
        if(winning_propositions[0]==0){ //If the first proposition is the default proposition
            Ballots[key].Winning_Propositions.push(0);
        }else{
            uint i;
            while(Ballots[key].Winning_Propositions.length<winning_propositions_number){
                if(winning_propositions[i]!=0){ //0 proposition is conssidered only if it is in the first position
                    Ballots[key].Winning_Propositions.push(winning_propositions[i]);
                }
                i++;        
            }
        }
        
        
    }
    
    
    function Order_Proposition_Result(bytes32 key, uint prop1, uint prop2, uint median_grade)internal view returns(uint){
        if(median_grade==0){
            return (Ballots[key].Propositions_Results[prop1].Cumulated_Score[0]<Ballots[key].Propositions_Results[prop2].Cumulated_Score[0])? prop2:prop1;
        }else{
            return (Ballots[key].Propositions_Results[prop1].Cumulated_Score[median_grade-1]<Ballots[key].Propositions_Results[prop2].Cumulated_Score[median_grade-1])? prop2:prop1;
        }  
    }

    function Check_Voter_Address(bytes32 key, address voter_address) internal returns(bool){
        (bool success, bytes memory Data) = Ballots[key].Voters_Register_Address.call(abi.encodeWithSelector(Ballots[key].Check_Voter_Selector, voter_address));
        require(success, "Voter check function reverted");
        
        return abi.decode(Data, (bool));
    }
    
    
    /*GETTER*/
    
    function Get_Winning_Propositions(bytes32 key)external view override returns(uint[] memory){
        require(Ballots[key].Status == Ballot_Status.FINISHED, "Ballot still Pending");
        return Ballots[key].Winning_Propositions;
    }
    
    function Get_Winning_Proposition_byId(bytes32 key, uint Id)external view override returns(uint){
        //require(Ballots[key].Status == Ballot_Status.FINISHED, "Ballot still Pending");
        require(Id<Ballots[key].Winning_Propositions.length, "Id exceed Winning length");
        return Ballots[key].Winning_Propositions[Id];
    }

    function HasVoted(bytes32 key, address voter_address) external view override returns(bool hasvoted){
        return Ballots[key].Voters[voter_address].Voted;
    }
    
    function HasValidated(bytes32 key, address voter_address) external view override returns(bool Validated, bytes32 Choice){
         return (Ballots[key].Voters[voter_address].Validated, Ballots[key].Voters[voter_address].Choice);
    }

    function Get_Propositions_Result(bytes32 key, uint proposition_Id) external view returns(Propositions_Result memory proposition_result){
        return Ballots[key].Propositions_Results[proposition_Id];
    }
}
