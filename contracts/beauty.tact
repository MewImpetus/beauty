import "@stdlib/deploy";


message Vote {
    value: Int;
}

contract Beauty with Deployable {
    id: Int;
    votes: Int = 0;
    init(id:Int) {
        self.id = id;
    }

    receive(msg: Vote) {
        self.votes = self.votes + msg.value;
    }

    get fun get_votes(): Int {
        return self.votes;
    }
}