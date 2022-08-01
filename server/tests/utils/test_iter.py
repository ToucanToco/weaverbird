from weaverbird.utils.iter import combinations


def test_combinations():
    assert combinations(['A', 'B', 'C']) == [
        ('A',),
        ('B',),
        ('C',),
        ('A', 'B'),
        ('A', 'C'),
        ('B', 'C'),
        ('A', 'B', 'C'),
    ]
